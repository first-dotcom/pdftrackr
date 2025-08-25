CREATE INDEX IF NOT EXISTS "idx_pageviews_session_page" ON "page_views" ("session_id","page_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pageviews_duration" ON "page_views" ("duration");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_started" ON "view_sessions" ("share_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_email" ON "view_sessions" ("viewer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_device" ON "view_sessions" ("device");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_country" ON "view_sessions" ("country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_email" ON "view_sessions" ("share_id","viewer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_device" ON "view_sessions" ("share_id","device");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_viewsessions_share_country" ON "view_sessions" ("share_id","country");
