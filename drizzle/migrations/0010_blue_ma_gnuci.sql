ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plate_blocking_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "watermark_enabled" boolean NOT NULL DEFAULT false;
