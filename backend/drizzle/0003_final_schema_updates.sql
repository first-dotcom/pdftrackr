ALTER TABLE "view_sessions" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pageviews_session_page" ON "page_views" ("session_id","page_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pageviews_duration" ON "page_views" ("duration");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_started" ON "view_sessions" ("share_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_email" ON "view_sessions" ("viewer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_device" ON "view_sessions" ("device");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_country" ON "view_sessions" ("country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_email" ON "view_sessions" ("share_id","viewer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_device" ON "view_sessions" ("share_id","device");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_country" ON "view_sessions" ("share_id","country");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"rating" integer,
	"category" varchar(50),
	"status" varchar(20) NOT NULL DEFAULT 'pending',
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_user_id_idx" ON "feedback" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_category_idx" ON "feedback" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_user_created_idx" ON "feedback" ("user_id","created_at");--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedback_user_id_users_id_fk') THEN
        ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_active_idx" ON "view_sessions" ("is_active","last_active_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_session_detection_idx" ON "view_sessions" ("share_id","ip_address_hash","viewer_email") WHERE "viewer_email" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_session_detection_no_email_idx" ON "view_sessions" ("share_id","ip_address_hash") WHERE "viewer_email" IS NULL;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_number_check') THEN
        ALTER TABLE "page_views" ADD CONSTRAINT "page_number_check" 
        CHECK ("page_number" > 0);
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'duration_check') THEN
        ALTER TABLE "page_views" ADD CONSTRAINT "duration_check" 
        CHECK ("duration" >= 0);
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_duration_check') THEN
        ALTER TABLE "view_sessions" ADD CONSTRAINT "session_duration_check" 
        CHECK ("total_duration" >= 0);
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "page_views" DROP COLUMN IF EXISTS "scroll_depth";--> statement-breakpoint
ALTER TABLE "page_views" DROP CONSTRAINT IF EXISTS "scroll_depth_check";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_pageviews_scroll_depth";
