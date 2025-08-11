CREATE TYPE "public"."league_type" AS ENUM('MLB', 'NBA', 'NFL', 'NCAAFB', 'NCAABB');--> statement-breakpoint
ALTER TABLE "friendly_match_request" ALTER COLUMN "league" SET DATA TYPE "public"."league_type" USING "league"::"public"."league_type";--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "league" SET DATA TYPE "public"."league_type" USING "league"::"public"."league_type";--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "league" SET DATA TYPE "public"."league_type" USING "league"::"public"."league_type";--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "league" SET DATA TYPE "public"."league_type" USING "league"::"public"."league_type";--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "league" SET DATA TYPE "public"."league_type" USING "league"::"public"."league_type";