import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://cdn.example.com

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Generate a presigned PUT URL for uploading a photo to R2.
 * Returns both the presigned URL (for the client PUT) and the public URL
 * (for storing in the database after upload).
 */
export async function createPresignedUploadUrl(opts: {
  orgSlug: string;
  fileName: string;
  contentType: string;
}) {
  const { orgSlug, fileName, contentType } = opts;

  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `intake/${orgSlug}/${timestamp}-${random}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: MAX_SIZE, // used as max limit hint
  });

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });
  const publicUrl = `${PUBLIC_URL}/${key}`;

  return { presignedUrl, publicUrl, key };
}
