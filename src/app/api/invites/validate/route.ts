import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invites } from "@/lib/db/schema";

export async function POST(request: Request) {
  const { code, email } = await request.json();

  if (!code) {
    return NextResponse.json({ valid: false, error: "No invite code provided" });
  }

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.code, code.trim().toUpperCase()))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid invite code" });
  }

  if (invite.usedAt) {
    return NextResponse.json({
      valid: false,
      error: "This invite code has already been used",
    });
  }

  if (
    invite.email &&
    email &&
    invite.email.toLowerCase() !== email.toLowerCase()
  ) {
    return NextResponse.json({
      valid: false,
      error: "This invite code is not valid for this email address",
    });
  }

  return NextResponse.json({ valid: true });
}
