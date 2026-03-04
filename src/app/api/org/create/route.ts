import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const { betterAuthOrgId, name, slug } = await request.json();

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Org create error:", err);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 },
    );
  }
}
