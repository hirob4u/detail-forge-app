import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { generateQcChecklist } from "@/lib/qc-checklist";
import type { FinalQuote } from "@/lib/types/quote";

export async function GET(
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

  const [job] = await db
    .select({
      id: jobs.id,
      orgId: jobs.orgId,
      stage: jobs.stage,
      aiAssessment: jobs.aiAssessment,
      finalQuote: jobs.finalQuote,
      qcPhotos: jobs.qcPhotos,
      qcNotes: jobs.qcNotes,
      qcChecklist: jobs.qcChecklist,
      qcCompletedAt: jobs.qcCompletedAt,
      photos: jobs.photos,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate checklist if not yet created
  let checklist = job.qcChecklist ?? [];
  if (checklist.length === 0) {
    const quote = job.finalQuote as FinalQuote | null;
    const serviceNames = (quote?.lineItems ?? [])
      .filter((item) => item.included)
      .map((item) => item.name);

    checklist = generateQcChecklist(
      job.aiAssessment as Record<string, unknown> | null,
      serviceNames,
    );

    // Persist the generated checklist so it is not regenerated on subsequent visits
    await db
      .update(jobs)
      .set({ qcChecklist: checklist })
      .where(eq(jobs.id, jobId));
  }

  // Before photos -- metadata only, no signing
  const beforePhotos = (job.photos ?? []).map(
    (photo: { key: string; area: string; phase: string }) => ({
      key: photo.key,
      area: photo.area,
      phase: photo.phase,
    }),
  );

  // QC (after) photos -- metadata only
  const afterPhotos = (job.qcPhotos ?? []).map(
    (photo: { key: string; area: string; uploadedAt: string }) => ({
      key: photo.key,
      area: photo.area,
      uploadedAt: photo.uploadedAt,
    }),
  );

  return NextResponse.json({
    stage: job.stage,
    checklist,
    qcNotes: job.qcNotes,
    qcCompletedAt: job.qcCompletedAt,
    beforePhotos,
    afterPhotos,
  });
}

export async function PATCH(
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
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { checklist, qcNotes } = body;

  await db
    .update(jobs)
    .set({
      qcChecklist: checklist,
      qcNotes: qcNotes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)));

  return NextResponse.json({ success: true });
}
