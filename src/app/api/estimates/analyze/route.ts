import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, prompts } from "@/lib/db/schema";

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

  // Confirm processing has begun
  await db
    .update(jobs)
    .set({ analysisStatus: "processing" })
    .where(eq(jobs.id, jobId));

  try {
    // Fetch active assessment prompt
    const [promptRecord] = await db
      .select({ content: prompts.content })
      .from(prompts)
      .where(and(eq(prompts.name, "condition-assessment"), eq(prompts.active, true)))
      .limit(1);

    if (!promptRecord) {
      await db
        .update(jobs)
        .set({ analysisStatus: "failed" })
        .where(eq(jobs.id, jobId));
      return NextResponse.json(
        { error: "No active assessment prompt configured" },
        { status: 500 },
      );
    }

    // Fetch photos from R2 (max 8)
    const keysToFetch = photoKeys.slice(0, MAX_PHOTOS);
    const base64Results = await Promise.all(keysToFetch.map(fetchPhotoAsBase64));
    const photos = base64Results.filter((b): b is string => b !== null);

    if (photos.length === 0) {
      await db
        .update(jobs)
        .set({ analysisStatus: "failed" })
        .where(eq(jobs.id, jobId));
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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: promptRecord.content,
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      await db
        .update(jobs)
        .set({ analysisStatus: "failed" })
        .where(eq(jobs.id, jobId));
      return NextResponse.json(
        { error: "Assessment failed -- please try again" },
        { status: 500 },
      );
    }

    // Parse JSON response
    const cleaned = stripMarkdownFences(textBlock.text);
    const assessment = JSON.parse(cleaned) as ConditionAssessment;

    // Update job record with assessment and mark complete
    await db
      .update(jobs)
      .set({
        aiAssessment: assessment,
        analysisStatus: "complete",
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json(assessment);
  } catch (err) {
    await db
      .update(jobs)
      .set({ analysisStatus: "failed" })
      .where(eq(jobs.id, jobId));
    console.error(`Analysis failed for job ${jobId}:`, err);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 },
    );
  }
}
