ALTER TABLE "football_team_stats" ALTER COLUMN "passing_touchdowns" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "passing_touchdowns" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "rushing_touchdowns" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "rushing_touchdowns" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "special_teams_touchdowns" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "special_teams_touchdowns" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "total_passing_yards_allowed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "total_passing_yards_allowed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "total_rushing_yards_allowed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "total_rushing_yards_allowed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "offense_touchdowns" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "football_team_stats" ALTER COLUMN "offense_touchdowns" DROP NOT NULL;