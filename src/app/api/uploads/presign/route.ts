import { NextRequest, NextResponse } from "next/server";
import { presignRequestSchema } from "@/lib/validations/intake";
import { createPresignedUploadUrl } from "@/lib/r2";

// TODO: add rate limiting on this endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = presignRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { orgSlug, fileName, contentType } = parsed.data;

    const { presignedUrl, publicUrl } = await createPresignedUploadUrl({
      orgSlug,
      fileName,
      contentType,
    });

    return NextResponse.json({ presignedUrl, publicUrl });
  } catch (err) {
    console.error("Presign error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
