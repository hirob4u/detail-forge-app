ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "quote_token" varchar(64);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "quote_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contact_preference" text DEFAULT 'both';--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_quote_token_unique'
  ) THEN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_quote_token_unique" UNIQUE("quote_token");
  END IF;
END $$;
