ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "photo_upload_token" varchar(64);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "has_new_photos" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "photo_request_sent_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_photo_upload_token_unique') THEN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_photo_upload_token_unique" UNIQUE("photo_upload_token");
  END IF;
END $$;
