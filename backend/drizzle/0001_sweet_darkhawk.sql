ALTER TABLE "view_sessions" RENAME COLUMN "ip_address" TO "ip_address_hash";--> statement-breakpoint
DROP INDEX IF EXISTS "view_sessions_ip_idx";--> statement-breakpoint
ALTER TABLE "view_sessions" ALTER COLUMN "ip_address_hash" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "ip_address_country" varchar(2);--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "consent_given" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "view_sessions" ADD COLUMN "data_retention_date" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_ip_hash_idx" ON "view_sessions" ("ip_address_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "view_sessions_retention_idx" ON "view_sessions" ("data_retention_date");