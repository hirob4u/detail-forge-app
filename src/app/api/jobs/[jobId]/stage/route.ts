import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import type { JobStage } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { STAGE_TRANSITIONS } from "@/lib/stage-transitions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || !body.to) {
    return NextResponse.json(
      { error: "Missing 'to' stage" },
      { status: 400 },
    );
  }

  const { to, note } = body as { to: string; note?: string };

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

  const historyEntry = {
    from: job.stage,
    to,
    at: new Date().toISOString(),
    ...(note ? { note } : {}),
  };

  const updatedHistory = [...(job.stageHistory ?? []), historyEntry];

  await db
    .update(jobs)
    .set({
      stage: to as JobStage,
      stageHistory: updatedHistory,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  return NextResponse.json({ success: true, stage: to });
}
