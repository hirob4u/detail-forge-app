import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  const [job] = await db
    .select({
      analysisStatus: jobs.analysisStatus,
      stage: jobs.stage,
      aiAssessment: jobs.aiAssessment,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    analysisStatus: job.analysisStatus,
    stage: job.stage,
    hasAssessment: job.aiAssessment !== null,
  });
}
