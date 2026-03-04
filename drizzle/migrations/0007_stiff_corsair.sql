ALTER TABLE "organizations" ADD COLUMN "shop_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "shop_tagline" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_key" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "accent_color" text DEFAULT '#7C4DFF';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "name_font" text DEFAULT 'DM Sans';