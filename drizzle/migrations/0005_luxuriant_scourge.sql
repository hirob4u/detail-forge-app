ALTER TYPE "public"."job_stage" ADD VALUE 'quoted' BEFORE 'sent';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "assessment_feedback" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "assessment_feedback_rating" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "final_quote" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "quoted_at" timestamp with time zone;