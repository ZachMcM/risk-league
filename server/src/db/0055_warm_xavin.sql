CREATE TYPE "public"."prop_status" AS ENUM('resolved', 'not_resolved', 'did_not_play');--> statement-breakpoint
DROP INDEX "idx_prop_league_resolved";--> statement-breakpoint
ALTER TABLE "prop" ADD COLUMN "status" "prop_status" DEFAULT 'not_resolved' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_prop_league_status" ON "prop" USING btree ("league","status");--> statement-breakpoint
ALTER TABLE "prop" DROP COLUMN "resolved";