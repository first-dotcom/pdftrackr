ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "page_count" integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_page_count_idx" ON "files" ("page_count");

