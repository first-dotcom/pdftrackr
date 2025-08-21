-- Analytics performance indexes for efficient aggregation and pagination
-- Migration: 0004_analytics_indexes

-- Page views indexes for aggregation
CREATE INDEX IF NOT EXISTS idx_pageviews_session_page ON page_views(session_id, page_number);
CREATE INDEX IF NOT EXISTS idx_pageviews_duration ON page_views(duration);

-- View sessions indexes for filtering and pagination
CREATE INDEX IF NOT EXISTS idx_viewsessions_share_started ON view_sessions(share_id, started_at);
CREATE INDEX IF NOT EXISTS idx_viewsessions_email ON view_sessions(viewer_email);
CREATE INDEX IF NOT EXISTS idx_viewsessions_device ON view_sessions(device);
CREATE INDEX IF NOT EXISTS idx_viewsessions_country ON view_sessions(country);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_viewsessions_share_email ON view_sessions(share_id, viewer_email);
CREATE INDEX IF NOT EXISTS idx_viewsessions_share_device ON view_sessions(share_id, device);
CREATE INDEX IF NOT EXISTS idx_viewsessions_share_country ON view_sessions(share_id, country);
