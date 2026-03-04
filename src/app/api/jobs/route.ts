import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs, customers, vehicles } from "@/lib/db/schema";
import type { jobStageEnum } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";

export async function GET(request: NextRequest) {
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

  const stageParam = request.nextUrl.searchParams.get("stage") as
    | (typeof jobStageEnum.enumValues)[number]
    | null;

  const whereConditions = stageParam
    ? and(eq(jobs.orgId, orgId), eq(jobs.stage, stageParam))
    : eq(jobs.orgId, orgId);

  const jobList = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      analysisStatus: jobs.analysisStatus,
      createdAt: jobs.createdAt,
      quotedAt: jobs.quotedAt,
      estimateAmount: jobs.estimateAmount,
      finalAmount: jobs.finalAmount,
      finalQuote: jobs.finalQuote,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
      },
      vehicle: {
        year: vehicles.year,
        make: vehicles.make,
        model: vehicles.model,
        color: vehicles.color,
      },
    })
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
    .where(whereConditions)
    .orderBy(desc(jobs.createdAt));

  return NextResponse.json(jobList);
}
