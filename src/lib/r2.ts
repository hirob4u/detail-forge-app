import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// S3-compatible client (shared across both buckets — same R2 account)
// ---------------------------------------------------------------------------

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ---------------------------------------------------------------------------
// Bucket references
// ---------------------------------------------------------------------------

export const PHOTOS_BUCKET = process.env.R2_BUCKET_PHOTOS!;
export const LOGOS_BUCKET = process.env.R2_BUCKET_LOGOS!;

// ---------------------------------------------------------------------------
// Shared validation
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// ---------------------------------------------------------------------------
// Photos bucket — presigned upload (for job-associated photos)
// ---------------------------------------------------------------------------

/**
 * Generate a presigned PUT URL for uploading a job photo to the photos bucket.
 * Key pattern: photos/{orgId}/{jobId}/{area}-{timestamp}.{ext}
 */
export async function createPresignedUploadUrl(opts: {
  orgId: string;
  jobId: string;
  area: string;
  fileName: string;
  contentType: string;
}) {
  const { orgId, jobId, area, fileName, contentType } = opts;

  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const ext = fileName.split(".").pop() ?? "jpg";
  const key = `photos/${orgId}/${jobId}/${area}-${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

  return { presignedUrl, key };
}

// ---------------------------------------------------------------------------
// Logos bucket — presigned upload
// ---------------------------------------------------------------------------

/**
 * Generate a presigned PUT URL for uploading a logo to the logos bucket.
 * Key pattern: logos/{orgId}/{timestamp}-{random}-{safeName}
 */
export async function createPresignedLogoUploadUrl(opts: {
  orgId: string;
  fileName: string;
  contentType: string;
}) {
  const { orgId, fileName, contentType } = opts;

  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `logos/${orgId}/${timestamp}-${random}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: LOGOS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

  return { presignedUrl, key };
}

// ---------------------------------------------------------------------------
// Photos bucket — presigned GET (for viewing)
// ---------------------------------------------------------------------------

/**
 * Generate a presigned GET URL for viewing a photo from the photos bucket.
 * URLs expire after 1 hour by default.
 */
export async function createPresignedGetUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}
