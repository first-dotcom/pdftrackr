-- Create global_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS "global_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_unique_views" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"avg_session_duration" integer DEFAULT 0 NOT NULL,
	"total_files" integer DEFAULT 0 NOT NULL,
	"total_shares" integer DEFAULT 0 NOT NULL,
	"total_email_captures" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "global_analytics_single_row_idx" ON "global_analytics" USING btree ("id");
--> statement-breakpoint
-- Insert the initial row for global analytics if it doesn't exist
INSERT INTO "global_analytics" ("id", "total_views", "total_unique_views", "total_duration", "avg_session_duration", "total_files", "total_shares", "total_email_captures") 
VALUES (1, 0, 0, 0, 0, 0, 0, 0) 
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
-- Populate global analytics with current calculated values from existing data
-- This ensures we have accurate starting values even if old data gets deleted
UPDATE global_analytics 
SET 
  total_views = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM view_sessions
  ),
  total_unique_views = (
    SELECT COALESCE(SUM(CASE WHEN is_unique THEN 1 ELSE 0 END), 0) 
    FROM view_sessions
  ),
  total_duration = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN total_duration > 0 THEN total_duration
        ELSE (
          SELECT COALESCE(SUM(CASE WHEN pv.duration > 0 THEN pv.duration ELSE 0 END), 1000)
          FROM page_views pv WHERE pv.session_id = view_sessions.session_id
        )
      END
    ), 0)
    FROM view_sessions
  ),
  avg_session_duration = (
    SELECT COALESCE(AVG(
      CASE 
        WHEN total_duration > 0 THEN total_duration
        ELSE (
          SELECT COALESCE(SUM(CASE WHEN pv.duration > 0 THEN pv.duration ELSE 0 END), 1000)
          FROM page_views pv WHERE pv.session_id = view_sessions.session_id
        )
      END
    ), 0)
    FROM view_sessions
  ),
  total_files = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM files
  ),
  total_shares = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM share_links
  ),
  total_email_captures = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM email_captures
  ),
  last_updated = now()
WHERE id = 1;
