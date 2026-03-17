ALTER TYPE "public"."job_stage" ADD VALUE 'archived';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "qc_photos" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "qc_notes" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "qc_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "qc_checklist" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plate_blocking_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "watermark_enabled" boolean DEFAULT true NOT NULL;