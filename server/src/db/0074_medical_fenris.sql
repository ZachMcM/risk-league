ALTER TABLE "dynasty_league" ADD COLUMN "max_users" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "dynasty_league" ADD COLUMN "admin_cup" boolean DEFAULT false NOT NULL;