import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { orgProfileUpdateSchema } from "@/lib/validations/org-profile";
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

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      businessEmail: organizations.businessEmail,
      phone: organizations.phone,
      website: organizations.website,
      city: organizations.city,
      state: organizations.state,
      shopName: organizations.shopName,
      shopTagline: organizations.shopTagline,
      logoKey: organizations.logoKey,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(org);
}

export async function PATCH(request: NextRequest) {
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

  try {
    const body = await request.json();
    const parsed = orgProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates = parsed.data;

    // Build logoUrl from logoKey if logoKey is being set
    if (updates.logoKey && process.env.R2_PUBLIC_URL) {
      updates.logoUrl = `${process.env.R2_PUBLIC_URL}/${updates.logoKey}`;
    } else if (updates.logoKey === null) {
      updates.logoUrl = null;
    }

    await db
      .update(organizations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    // Return updated org
    const [updated] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        businessEmail: organizations.businessEmail,
        phone: organizations.phone,
        website: organizations.website,
        city: organizations.city,
        state: organizations.state,
        shopName: organizations.shopName,
        shopTagline: organizations.shopTagline,
        logoKey: organizations.logoKey,
        logoUrl: organizations.logoUrl,
        accentColor: organizations.accentColor,
        nameFont: organizations.nameFont,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Org profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}
