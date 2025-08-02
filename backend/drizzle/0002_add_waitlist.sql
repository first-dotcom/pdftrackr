-- Migration to add waitlist table for premium plan signups

CREATE TABLE IF NOT EXISTS "waitlist" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "plan" varchar(20) NOT NULL,
  "source" varchar(100),
  "ip_address" varchar(45),
  "user_agent" text,
  "referer" text,
  "notified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_email_idx" ON "waitlist" ("email");
CREATE INDEX IF NOT EXISTS "waitlist_plan_idx" ON "waitlist" ("plan");
CREATE INDEX IF NOT EXISTS "waitlist_created_at_idx" ON "waitlist" ("created_at");