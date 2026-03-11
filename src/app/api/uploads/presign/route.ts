import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { presignRequestSchema } from "@/lib/validations/intake";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { r2, PHOTOS_BUCKET } from "@/lib/r2";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

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

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 },
      );
    }

    // Look up org by slug to get stable orgId for key path
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Key pattern: intake/{orgId}/{timestamp}-{random}-{safeName}
    // Note: no jobId available at intake time — job is created on form submit
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `intake/${org.id}/${timestamp}-${random}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: PHOTOS_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

    return NextResponse.json({ presignedUrl, key });
  } catch (err) {
    console.error("Presign error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
