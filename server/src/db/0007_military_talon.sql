ALTER TABLE "player" ALTER COLUMN "league" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "prop" ALTER COLUMN "league" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "league" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."league_type";