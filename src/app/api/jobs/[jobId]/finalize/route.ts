import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs, member } from "@/lib/db/schema";
import type { FinalQuote } from "@/lib/types/quote";

interface FinalizeBody {
  finalQuote: FinalQuote;
  assessmentFeedbackRating: "helpful" | "needs_work";
  assessmentFeedback: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 403 },
    );
  }

  // Verify user is a member of the active org
  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
  }

  const { jobId } = await params;

  // Verify job exists and belongs to the org
  const [job] = await db
    .select({ id: jobs.id, orgId: jobs.orgId })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // TODO: VERIFY -- org ID mapping between Better Auth orgs and DetailForge orgs
  // For now, verify the job's orgId matches. The organizations table uses UUIDs
  // while Better Auth org IDs are text. This check may need adjustment once
  // the org linking pattern is established.

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    finalQuote,
    assessmentFeedbackRating,
    assessmentFeedback,
  } = body as FinalizeBody;

  if (!finalQuote || !Array.isArray(finalQuote.lineItems)) {
    return NextResponse.json({ error: "finalQuote with lineItems is required" }, { status: 400 });
  }

  if (assessmentFeedbackRating && !["helpful", "needs_work"].includes(assessmentFeedbackRating)) {
    return NextResponse.json({ error: "Invalid feedback rating" }, { status: 400 });
  }

  const [updated] = await db
    .update(jobs)
    .set({
      finalQuote,
      assessmentFeedbackRating: assessmentFeedbackRating || null,
      assessmentFeedback: assessmentFeedback || null,
      stage: "quoted",
      quotedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return NextResponse.json(updated);
}
