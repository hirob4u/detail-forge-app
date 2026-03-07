import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
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

  const body = await request.json().catch(() => null);
  if (!body || !body.key || !body.area) {
    return NextResponse.json(
      { error: "Missing key or area" },
      { status: 400 },
    );
  }

  const { key, area } = body as { key: string; area: string };

  const [job] = await db
    .select({ qcPhotos: jobs.qcPhotos })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = [
    ...(job.qcPhotos ?? []),
    { key, area, uploadedAt: new Date().toISOString() },
  ];

  await db
    .update(jobs)
    .set({ qcPhotos: updated, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  return NextResponse.json({ success: true });
}
