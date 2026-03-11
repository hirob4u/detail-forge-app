import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPresignedLogoUploadUrl } from "@/lib/r2";
import { getDetailForgeOrgId } from "@/lib/org";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const betterAuthOrgId = session.session.activeOrganizationId;
  if (!betterAuthOrgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 403 },
    );
  }

  const orgId = await getDetailForgeOrgId(betterAuthOrgId);
  if (!orgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 },
      );
    }

    const { presignedUrl, key } = await createPresignedLogoUploadUrl({
      orgId,
      fileName,
      contentType,
    });

    return NextResponse.json({ presignedUrl, key });
  } catch (err) {
    console.error("Logo presign error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
