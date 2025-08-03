CREATE TABLE IF NOT EXISTS "analytics_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"unique_views" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"avg_duration" integer DEFAULT 0 NOT NULL,
	"email_captures" integer DEFAULT 0 NOT NULL,
	"countries" json,
	"devices" json,
	"referers" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"share_id" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"referer" text,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"size" bigint NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"storage_url" text NOT NULL,
	"title" varchar(255),
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"download_enabled" boolean DEFAULT true NOT NULL,
	"watermark_enabled" boolean DEFAULT false NOT NULL,
	"password" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"file_hash" varchar(64),
	"scan_status" varchar(20) DEFAULT 'passed',
	"security_flags" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"scroll_depth" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "share_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer NOT NULL,
	"share_id" varchar(50) NOT NULL,
	"title" varchar(255),
	"description" text,
	"password" varchar(255),
	"email_gating_enabled" boolean DEFAULT false NOT NULL,
	"download_enabled" boolean DEFAULT true NOT NULL,
	"watermark_enabled" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"max_views" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"unique_view_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"storage_used" bigint DEFAULT 0 NOT NULL,
	"files_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "view_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"share_id" varchar(50) NOT NULL,
	"session_id" uuid NOT NULL,
	"viewer_email" varchar(255),
	"viewer_name" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"referer" text,
	"country" varchar(2),
	"city" varchar(100),
	"device" varchar(50),
	"browser" varchar(50),
	"os" varchar(50),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"is_unique" boolean DEFAULT true NOT NULL,
	"suspicious_flags" json,
	"risk_score" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"plan" varchar(20) NOT NULL,
	"source" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"referer" text,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_summary_file_id_date_idx" ON "analytics_summary" ("file_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_summary_date_idx" ON "analytics_summary" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_captures_share_id_idx" ON "email_captures" ("share_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_captures_email_idx" ON "email_captures" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_captures_captured_at_idx" ON "email_captures" ("captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_user_id_idx" ON "files" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_created_at_idx" ON "files" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_hash_idx" ON "files" ("file_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_ip_idx" ON "files" ("ip_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_session_id_idx" ON "page_views" ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_page_number_idx" ON "page_views" ("page_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_viewed_at_idx" ON "page_views" ("viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "share_links_share_id_idx" ON "share_links" ("share_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_links_file_id_idx" ON "share_links" ("file_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_links_expires_at_idx" ON "share_links" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_id_idx" ON "users" ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_share_id_idx" ON "view_sessions" ("share_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "view_sessions_session_id_idx" ON "view_sessions" ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_started_at_idx" ON "view_sessions" ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_ip_idx" ON "view_sessions" ("ip_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_risk_idx" ON "view_sessions" ("risk_score");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_email_idx" ON "waitlist" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waitlist_plan_idx" ON "waitlist" ("plan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waitlist_created_at_idx" ON "waitlist" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_summary" ADD CONSTRAINT "analytics_summary_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_captures" ADD CONSTRAINT "email_captures_share_id_share_links_share_id_fk" FOREIGN KEY ("share_id") REFERENCES "share_links"("share_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_views" ADD CONSTRAINT "page_views_session_id_view_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "view_sessions"("session_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share_links" ADD CONSTRAINT "share_links_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "view_sessions" ADD CONSTRAINT "view_sessions_share_id_share_links_share_id_fk" FOREIGN KEY ("share_id") REFERENCES "share_links"("share_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
