import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { createPresignedGetUrl } from "@/lib/r2";
import { getDetailForgeOrgId } from "@/lib/org";

interface PhotoEntry {
  key: string;
  area: string;
  phase: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const betterAuthOrgId = session.session.activeOrganizationId;
  const orgId = await getDetailForgeOrgId(betterAuthOrgId);
  if (!orgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 403 },
    );
  }

  const { jobId } = await params;

  const [job] = await db
    .select({ id: jobs.id, orgId: jobs.orgId, photos: jobs.photos })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.orgId !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const photos = (job.photos ?? []) as PhotoEntry[];

  if (photos.length === 0) {
    return NextResponse.json([]);
  }

  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => ({
      key: photo.key,
      area: photo.area,
      phase: photo.phase,
      url: await createPresignedGetUrl(photo.key),
    })),
  );

  return NextResponse.json(photosWithUrls);
}
