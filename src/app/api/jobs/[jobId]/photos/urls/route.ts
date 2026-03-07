import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { createPresignedGetUrl } from "@/lib/r2";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.keys) || body.keys.length === 0) {
    return NextResponse.json({ error: "No keys provided" }, { status: 400 });
  }

  const { keys } = body;

  const session = await auth.api.getSession({ headers: await headers() });
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

  // Verify the job belongs to this org before signing any URLs
  const [job] = await db
    .select({ photos: jobs.photos, qcPhotos: jobs.qcPhotos })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Validate every requested key belongs to this job (intake or QC photos)
  const jobPhotoKeys = new Set([
    ...(job.photos ?? []).map((p: { key: string }) => p.key),
    ...(job.qcPhotos ?? []).map((p: { key: string }) => p.key),
  ]);

  const invalidKeys = keys.filter((k: string) => !jobPhotoKeys.has(k));
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: "One or more keys do not belong to this job" },
      { status: 403 },
    );
  }

  // Generate presigned URLs in parallel
  const signed = await Promise.all(
    keys.map(async (key: string) => ({
      key,
      url: await createPresignedGetUrl(key),
    })),
  );

  return NextResponse.json({ photos: signed });
}
