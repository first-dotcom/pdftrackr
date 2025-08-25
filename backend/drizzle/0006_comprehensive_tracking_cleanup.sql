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
ALTER TABLE "view_sessions" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_active_idx" ON "view_sessions" ("is_active","last_active_at");--> statement-breakpoint
ALTER TABLE "page_views" DROP COLUMN IF EXISTS "scroll_depth";--> statement-breakpoint
ALTER TABLE "page_views" DROP CONSTRAINT IF EXISTS "scroll_depth_check";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_pageviews_scroll_depth";

-- Clean up any existing scroll_depth data (if column exists)
-- Note: This will fail if scroll_depth column doesn't exist, which is expected
-- since we already removed it in previous migrations

-- Summary of what this migration does:
-- ✅ Adds unique session detection (prevents race conditions)
-- ✅ Adds data validation constraints (ensures data integrity)
-- ✅ Adds session activity tracking (is_active column)
-- ✅ Removes scroll_depth tracking (useless for PDFs)
-- ✅ Simplifies tracking to essential metrics only

-- Essential tracking data that remains:
-- 1. Page view duration (time spent per page in milliseconds)
-- 2. Page view count (how many times each page was viewed)
-- 3. Session data (total session duration, unique sessions)
-- 4. Basic analytics (average time per page, total views per page)

-- Removed over-engineered features:
-- ❌ Scroll depth tracking (useless for PDFs)
-- ❌ Completion rate based on scroll depth
-- ❌ Skim rate calculations
-- ❌ Complex percentile calculations (p25, p75, median)
-- ❌ Drop-off funnel calculations
-- ❌ Mobile-specific scroll adjustments
