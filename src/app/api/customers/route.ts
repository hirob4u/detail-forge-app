import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
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

  const customerList = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.orgId, activeOrgId))
    .orderBy(desc(customers.createdAt));

  return NextResponse.json(customerList);
}
