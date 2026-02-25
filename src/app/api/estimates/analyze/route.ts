import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreDimension {
  score: number;
  description: string;
  recommendedService: string;
}

interface ConditionAssessment {
  scores: {
    paintCondition: ScoreDimension;
    scratchSeverity: ScoreDimension;
    contamination: ScoreDimension;
    interior: ScoreDimension;
    wheelsTrim: ScoreDimension;
  };
  recommendedServices: Array<{
    name: string;
    note?: string;
    basePrice: number;
    adjustedPrice: number;
  }>;
  confidence: number;
  flags: string[];
}

// ---------------------------------------------------------------------------
// R2 client (uses R2_ACCOUNT_ID-based endpoint per Blueprint D spec)
// ---------------------------------------------------------------------------

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;

// ---------------------------------------------------------------------------
// Claude client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

const MAX_PHOTOS = 8;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert automotive detailing assessment tool. You analyze photos of vehicles and produce a structured condition assessment for professional detailers to use when building estimates.

Your output must be valid JSON only. No markdown fences, no preamble, no explanation outside the JSON object. Output the raw JSON object and nothing else.

The JSON must match this exact schema:

{
  "scores": {
    "paintCondition": { "score": <number 1-10>, "description": "<string>", "recommendedService": "<string>" },
    "scratchSeverity": { "score": <number 1-10>, "description": "<string>", "recommendedService": "<string>" },
    "contamination": { "score": <number 1-10>, "description": "<string>", "recommendedService": "<string>" },
    "interior": { "score": <number 1-10>, "description": "<string>", "recommendedService": "<string>" },
    "wheelsTrim": { "score": <number 1-10>, "description": "<string>", "recommendedService": "<string>" }
  },
  "recommendedServices": [
    { "name": "<string>", "note": "<string or omit>", "basePrice": <number>, "adjustedPrice": <number> }
  ],
  "confidence": <number 0-100>,
  "flags": ["<string>"]
}

Scoring rubric for each dimension (1 = worst, 10 = best):

- Paint Condition: Evaluate swirl marks, oxidation, water spots, clear coat health, and surface contamination. 1 = severe damage requiring full paint restoration. 10 = perfect showroom condition with no visible defects.

- Scratch Severity: Evaluate depth and extent of scratches and marring across all panels. 1 = deep paint scratches through to primer or bare metal. 10 = no scratches or marring visible.

- Contamination: Evaluate industrial fallout, water spot etching, tar deposits, tree sap, and embedded debris. 1 = heavily contaminated surfaces requiring aggressive chemical decontamination. 10 = clean surfaces with no embedded contaminants.

- Interior: Evaluate staining, wear, and soiling on seats, carpet, dashboard, headliner, and door panels. 1 = heavily soiled with damage, stains, and wear. 10 = pristine interior with no visible wear or soiling.

- Wheels/Trim: Evaluate brake dust buildup, exterior trim condition, and wheel finish condition. 1 = heavily corroded wheels, damaged trim, severe brake dust etching. 10 = perfect wheel finish and trim condition.

For each dimension, provide a concise description of what you observe and recommend a specific detailing service to address the condition.

For recommendedServices: provide realistic professional detailing prices. Use the vehicle information (year, make, model) to adjust pricing -- luxury, exotic, and larger vehicles command higher prices than economy vehicles. Each service should have a basePrice (standard rate) and an adjustedPrice (adjusted for this specific vehicle).

Set confidence (0-100) based on photo quality and coverage. If photos are blurry, poorly lit, or don't cover all areas of the vehicle, lower the confidence. If confidence is below 60, include a flag explaining what additional photos or information would help.

Populate flags with any specific concerns worth verifying in person before finalizing the quote. For example: "Driver door scratch appears to extend into primer -- verify depth before quoting correction." or "Photos do not show interior -- interior score is estimated." Flags should be actionable for the detailer.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchPhotoAsBase64(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    const response = await r2Client.send(command);
    const bytes = await response.Body!.transformToByteArray();
    return Buffer.from(bytes).toString("base64");
  } catch (err) {
    console.error(`Failed to fetch photo from R2 (key: ${key}):`, err);
    return null;
  }
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    jobId,
    photoKeys,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    vehicleColor,
  } = body as {
    jobId: string;
    photoKeys: string[];
    vehicleYear: number;
    vehicleMake: string;
    vehicleModel: string;
    vehicleColor: string;
  };

  // Validate required fields
  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  if (!Array.isArray(photoKeys) || photoKeys.length === 0) {
    return NextResponse.json(
      { error: "At least one photo is required" },
      { status: 400 },
    );
  }

  // Verify job exists
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch photos from R2 (max 8)
  const keysToFetch = photoKeys.slice(0, MAX_PHOTOS);
  const base64Results = await Promise.all(keysToFetch.map(fetchPhotoAsBase64));
  const photos = base64Results.filter((b): b is string => b !== null);

  if (photos.length === 0) {
    return NextResponse.json(
      { error: "Failed to fetch any photos from storage" },
      { status: 500 },
    );
  }

  // Build Claude API message content
  const imageBlocks: Anthropic.ImageBlockParam[] = photos.map((data) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data,
    },
  }));

  const userContent: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel} in ${vehicleColor}`,
    },
    ...imageBlocks,
  ];

  // Call Claude API
  let responseText: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Assessment failed -- please try again" },
        { status: 500 },
      );
    }
    responseText = textBlock.text;
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json(
      { error: "Assessment failed -- please try again" },
      { status: 500 },
    );
  }

  // Parse JSON response
  let assessment: ConditionAssessment;
  try {
    const cleaned = stripMarkdownFences(responseText);
    assessment = JSON.parse(cleaned) as ConditionAssessment;
  } catch {
    console.error("Failed to parse Claude response as JSON:", responseText);
    return NextResponse.json(
      { error: "Assessment failed -- please try again" },
      { status: 500 },
    );
  }

  // Update job record with assessment
  await db
    .update(jobs)
    .set({ aiAssessment: assessment })
    .where(eq(jobs.id, jobId));

  return NextResponse.json(assessment);
}
