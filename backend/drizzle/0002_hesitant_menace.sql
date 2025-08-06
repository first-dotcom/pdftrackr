CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" varchar(50) NOT NULL,
	"file_id" varchar(255),
	"share_id" varchar(255),
	"user_id" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"email" varchar(255),
	"success" boolean,
	"scan_result" varchar(20),
	"threats" json DEFAULT '[]'::json,
	"scanners" json DEFAULT '[]'::json,
	"metadata" json DEFAULT '{}'::json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_event_idx" ON "audit_logs" ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_file_id_idx" ON "audit_logs" ("file_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_share_id_idx" ON "audit_logs" ("share_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_file_timestamp_idx" ON "audit_logs" ("file_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_ip_idx" ON "audit_logs" ("ip_address");