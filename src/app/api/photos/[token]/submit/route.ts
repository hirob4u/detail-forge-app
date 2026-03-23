import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { photoKeys } = body as {
    photoKeys: Array<{ key: string; area: string; phase: string }>;
  };

  if (!Array.isArray(photoKeys) || photoKeys.length === 0) {
    return NextResponse.json(
      { error: "At least one photo is required" },
      { status: 400 },
    );
  }

  // Look up job by token
  const [job] = await db
    .select({ id: jobs.id, orgId: jobs.orgId })
    .from(jobs)
    .where(eq(jobs.photoUploadToken, token))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // Validate each key: must be a non-empty string with the expected prefix
  const expectedPrefix = `followup/${job.orgId}/${job.id}/`;
  for (const pk of photoKeys) {
    if (!pk.key || typeof pk.key !== "string") {
      return NextResponse.json(
        { error: "Each photo must have a key" },
        { status: 400 },
      );
    }
    if (!pk.key.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Invalid photo key" },
        { status: 400 },
      );
    }
  }

  // Atomic merge using SQL jsonb concatenation — prevents race conditions
  await db
    .update(jobs)
    .set({
      photos: sql`COALESCE(${jobs.photos}, '[]'::jsonb) || ${JSON.stringify(photoKeys)}::jsonb`,
      hasNewPhotos: true,
      updatedAt: sql`now()`,
    })
    .where(eq(jobs.id, job.id));

  return NextResponse.json({
    success: true,
    newPhotos: photoKeys.length,
  });
}
