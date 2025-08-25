CREATE TABLE IF NOT EXISTS "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"rating" integer,
	"category" varchar(50),
	"status" varchar(20) NOT NULL DEFAULT 'pending',
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_user_id_idx" ON "feedback" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_category_idx" ON "feedback" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_user_created_idx" ON "feedback" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
