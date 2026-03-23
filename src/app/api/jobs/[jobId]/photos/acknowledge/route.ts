import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDetailForgeOrgId } from "@/lib/org";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session?.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDetailForgeOrgId(session.session.activeOrganizationId);
  if (!orgId) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { jobId } = await params;

  await db
    .update(jobs)
    .set({ hasNewPhotos: false })
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)));

  return NextResponse.json({ success: true });
}
