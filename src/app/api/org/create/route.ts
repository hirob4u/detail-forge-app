import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, invites } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const { betterAuthOrgId, name, slug, inviteCode, email } =
      await request.json();

    if (!betterAuthOrgId || !name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await db.insert(organizations).values({
      betterAuthOrgId,
      name,
      slug,
      businessEmail: "",
      phone: "",
      city: "",
      state: "",
    });

    // Mark invite code as used on successful account creation
    if (inviteCode) {
      await db
        .update(invites)
        .set({
          usedAt: new Date(),
          usedBy: email ?? null,
        })
        .where(eq(invites.code, inviteCode.trim().toUpperCase()));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Org create error:", err);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 },
    );
  }
}
