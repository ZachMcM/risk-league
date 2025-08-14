ALTER TABLE "football_player_stats" ALTER COLUMN "fumbles_lost" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "football_player_stats" ALTER COLUMN "rushing_long" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "receiving_long" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "receiving_yards" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "receivingAttempts" integer DEFAULT 0 NOT NULL;