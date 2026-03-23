import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";

const MAX_RETRIES = 3;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  // Validate UUID format
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      jobId,
    )
  ) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDetailForgeOrgId(
    session.session.activeOrganizationId,
  );
  if (!orgId) {
    return NextResponse.json(
      { error: "No organization" },
      { status: 403 },
    );
  }

  // Fetch job — org-scoped
  const [job] = await db
    .select({
      id: jobs.id,
      analysisStatus: jobs.analysisStatus,
      analysisRetryCount: jobs.analysisRetryCount,
      photos: jobs.photos,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Only retry if failed or stuck (processing for > 2 min handled by client)
  if (
    job.analysisStatus !== "failed" &&
    job.analysisStatus !== "processing"
  ) {
    return NextResponse.json(
      { error: "Analysis is not in a retryable state" },
      { status: 400 },
    );
  }

  // Enforce retry limit
  if (job.analysisRetryCount >= MAX_RETRIES) {
    return NextResponse.json(
      { error: "Maximum retry attempts reached. Please contact support." },
      { status: 429 },
    );
  }

  // Verify photos exist
  if (!job.photos || job.photos.length === 0) {
    return NextResponse.json(
      { error: "No photos available for analysis" },
      { status: 400 },
    );
  }

  // Set status to processing in DB BEFORE returning so polls see
  // the correct state immediately — eliminates the flash of "failed"
  // while the fire-and-forget analyze request is still in flight.
  await db
    .update(jobs)
    .set({ analysisStatus: "processing" })
    .where(eq(jobs.id, jobId));

  // Fire-and-forget to the analyze endpoint with internal secret
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://detailforge.io";

  fetch(`${baseUrl}/api/estimates/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({ jobId }),
  }).catch((err) => {
    console.error(`Retry analysis fire-and-forget failed for ${jobId}:`, err);
  });

  return NextResponse.json({ success: true, retryCount: job.analysisRetryCount + 1 });
}
