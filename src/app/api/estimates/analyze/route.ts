import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, prompts, vehicles } from "@/lib/db/schema";
import { r2, PHOTOS_BUCKET } from "@/lib/r2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { ConditionAssessment } from "@/lib/types/assessment";
import { normalizeFlags } from "@/lib/normalize-flags";

// ---------------------------------------------------------------------------
// Claude client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

const MAX_PHOTOS = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchPhotoAsBase64(
  key: string,
): Promise<{ base64: string; mediaType: "image/jpeg" } | null> {
  try {
    const command = new GetObjectCommand({ Bucket: PHOTOS_BUCKET, Key: key });
    const response = await r2.send(command);
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) return null;

    const resized = await sharp(Buffer.from(bytes))
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    return {
      base64: resized.toString("base64"),
      mediaType: "image/jpeg",
    };
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
  // Validate internal API secret — this route is in PUBLIC_PREFIXES
  // so the proxy doesn't enforce session auth. The secret ensures only
  // our own intake submit route can trigger analysis.
  const secret = request.headers.get("x-internal-secret");
  if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { jobId, photoKeys } = body as {
    jobId: string;
    photoKeys: Array<string | { key: string; area: string; phase: string }>;
  };

  // Validate required fields
  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  // Verify job exists and fetch stored photos/notes as fallback
  const [job] = await db
    .select({
      id: jobs.id,
      vehicleId: jobs.vehicleId,
      photos: jobs.photos,
      notes: jobs.notes,
      intents: jobs.intents,
      analysisRetryCount: jobs.analysisRetryCount,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch vehicle info from DB — always authoritative, works for both
  // initial intake and retries (previously retries sent "undefined" values)
  const [vehicle] = await db
    .select({
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      color: vehicles.color,
    })
    .from(vehicles)
    .where(eq(vehicles.id, job.vehicleId))
    .limit(1);

  const vehicleText = vehicle
    ? `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`
    : "Vehicle information not available";

  // Use photoKeys from request body, or fall back to DB photos
  const resolvedPhotoKeys: Array<string | { key: string; area: string; phase: string }> =
    Array.isArray(photoKeys) && photoKeys.length > 0
      ? photoKeys
      : (job.photos ?? []);

  const hasPhotos = resolvedPhotoKeys.length > 0;

  // Confirm processing has begun and increment retry count
  await db
    .update(jobs)
    .set({
      analysisStatus: "processing",
      analysisRetryCount: sql`${jobs.analysisRetryCount} + 1`,
    })
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

    // Build context text — always include vehicle info and customer notes
    // Wrap user-supplied notes in XML delimiters to reduce prompt injection surface
    // Escape angle brackets to prevent XML breakout
    const escapedNotes = job.notes
      ? job.notes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      : null;
    const notesText = escapedNotes
      ? `\n<customer_notes>${escapedNotes}</customer_notes>`
      : "";
    const intentsArray = (job.intents ?? []) as string[];
    const intentsText = intentsArray.length > 0
      ? `\nCustomer is looking for: ${intentsArray.join(", ")}`
      : "";
    const contextText = `${vehicleText}${intentsText}${notesText}`;

    let userContent: Anthropic.ContentBlockParam[];

    if (hasPhotos) {
      // --- Photo path: fetch from R2 and include images ---
      const keysToFetch = resolvedPhotoKeys
        .slice(0, MAX_PHOTOS)
        .map((k) => (typeof k === "string" ? k : k.key));
      const photoResults = await Promise.all(keysToFetch.map(fetchPhotoAsBase64));
      const validPhotos = photoResults.filter(
        (p): p is { base64: string; mediaType: "image/jpeg" } => p !== null,
      );

      if (validPhotos.length === 0) {
        await db
          .update(jobs)
          .set({ analysisStatus: "failed" })
          .where(eq(jobs.id, jobId));
        return NextResponse.json(
          { error: "Failed to fetch any photos from storage" },
          { status: 500 },
        );
      }

      const imageBlocks: Anthropic.ImageBlockParam[] = validPhotos.map((photo) => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: photo.mediaType,
          data: photo.base64,
        },
      }));

      userContent = [
        { type: "text", text: contextText },
        ...imageBlocks,
      ];
    } else {
      // --- No-photo path: vehicle info + notes only ---
      userContent = [
        {
          type: "text",
          text: `${contextText}\n\nIMPORTANT: No photos were submitted with this estimate request. You cannot perform visual assessment. Set all photo-dependent scores to null. Focus your response on: vehicle-specific insights based on year/make/model/color, common service recommendations for this vehicle type and age, potential upsell opportunities, and flag that photo follow-up is recommended before finalizing the quote. Set confidence to 15 and include a flag with severity "moderate", title "No Photos Submitted", and description explaining that photo follow-up is recommended.`,
        },
      ];
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
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
    const raw = JSON.parse(cleaned) as Record<string, unknown>;

    // Normalize flags — handles both legacy string[] and new structured format
    const assessment: ConditionAssessment = {
      ...raw,
      flags: normalizeFlags(raw.flags),
    } as ConditionAssessment;

    // Enforce null scores when no photos were submitted — Claude may
    // return numeric scores despite being told not to
    if (!hasPhotos) {
      for (const key of Object.keys(assessment.scores) as Array<keyof typeof assessment.scores>) {
        assessment.scores[key].score = null;
      }
      assessment.confidence = Math.min(assessment.confidence, 20);
      const hasNoPhotosFlag = assessment.flags.some(
        (f) => f.title === "No Photos Submitted" || f.description.includes("no-photos-submitted"),
      );
      if (!hasNoPhotosFlag) {
        assessment.flags.unshift({
          severity: "moderate",
          title: "No Photos Submitted",
          description:
            "No photos were submitted with this estimate request. Photo follow-up is recommended before finalizing the quote.",
        });
      }
      if (assessment.briefing) {
        assessment.briefing.photoFollowUp = true;
      } else {
        // Create minimal briefing stub when LLM omitted it
        assessment.briefing = {
          summary: vehicleText,
          customerIntent: "No specific preferences indicated.",
          suggestedStartingPoint: "Request photos from customer before scoping services.",
          upsellFlags: [],
          photoFollowUp: true,
        };
      }
    }

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
