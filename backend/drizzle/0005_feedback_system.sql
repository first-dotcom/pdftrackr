-- Migration: Add feedback system
-- Created: 2024-01-01

-- Create feedback table
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "message" text NOT NULL,
  "rating" integer CHECK ("rating" >= 1 AND "rating" <= 5),
  "category" varchar(50), -- bug, feature, general, etc.
  "status" varchar(20) NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, closed
  "admin_notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "feedback_user_id_idx" ON "feedback"("user_id");
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback"("created_at");
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback"("status");
CREATE INDEX IF NOT EXISTS "feedback_category_idx" ON "feedback"("category");

-- Create composite index for rate limiting queries
CREATE INDEX IF NOT EXISTS "feedback_user_created_idx" ON "feedback"("user_id", "created_at");

-- Add comment for documentation
COMMENT ON TABLE "feedback" IS 'Stores user feedback with rate limiting support (1 per 5 minutes per user)';
COMMENT ON COLUMN "feedback"."rating" IS 'User rating from 1-5 stars';
COMMENT ON COLUMN "feedback"."category" IS 'Feedback category: bug, feature, general, etc.';
COMMENT ON COLUMN "feedback"."status" IS 'Feedback status: pending, reviewed, resolved, closed';
