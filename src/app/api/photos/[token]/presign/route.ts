import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { r2, PHOTOS_BUCKET } from "@/lib/r2";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { fileName, contentType, fileSize } = body as {
    fileName: string;
    contentType: string;
    fileSize?: number;
  };

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName and contentType are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 },
    );
  }

  if (fileSize && fileSize > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 10 MB limit" },
      { status: 400 },
    );
  }

  // Look up job by token
  const [job] = await db
    .select({ id: jobs.id, orgId: jobs.orgId })
    .from(jobs)
    .where(eq(jobs.photoUploadToken, token))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // Generate presigned upload URL
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `followup/${job.orgId}/${job.id}/${timestamp}-${random}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

  return NextResponse.json({ presignedUrl, key });
}
