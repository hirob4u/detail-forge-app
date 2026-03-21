import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs, jobStageEnum } from "@/lib/db/schema";
import type { JobStage } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { STAGE_TRANSITIONS } from "@/lib/stage-transitions";

const VALID_STAGES: readonly string[] = jobStageEnum.enumValues;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !body.to) {
    return NextResponse.json(
      { error: "Missing 'to' stage" },
      { status: 400 },
    );
  }

  const { to, note } = body as { to: string; note?: string };

  if (!VALID_STAGES.includes(to)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

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

  const [job] = await db
    .select({
      id: jobs.id,
      orgId: jobs.orgId,
      stage: jobs.stage,
      stageHistory: jobs.stageHistory,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const allowed = STAGE_TRANSITIONS[job.stage as JobStage] ?? [];
  const transition = allowed.find((t) => t.to === to);
  if (!transition) {
    return NextResponse.json(
      { error: `Cannot transition from ${job.stage} to ${to}` },
      { status: 400 },
    );
  }

  if (transition.requireNote && (!note || note.trim() === "")) {
    return NextResponse.json(
      { error: "A reason is required for this transition." },
      { status: 400 },
    );
  }

  const trimmedNote = note?.trim();
  const historyEntry = {
    from: job.stage,
    to,
    at: new Date().toISOString(),
    ...(trimmedNote ? { note: trimmedNote } : {}),
  };

  const updatedHistory = [...(job.stageHistory ?? []), historyEntry];

  await db
    .update(jobs)
    .set({
      stage: to as JobStage,
      stageHistory: updatedHistory,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)));

  return NextResponse.json({ success: true, stage: to });
}
