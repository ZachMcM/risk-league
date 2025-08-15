ALTER TABLE "football_player_stats" ADD COLUMN "field_goals_attempted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "field_goals_made" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "field_goals_long" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "extra_points_attempted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "extra_points_made" integer DEFAULT 0 NOT NULL;