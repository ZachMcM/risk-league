ALTER TABLE "football_player_stats" ADD COLUMN "receiving_touchdowns" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" DROP COLUMN "receivingAttempts";