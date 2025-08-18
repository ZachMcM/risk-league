ALTER TABLE "baseball_team_stats" ADD COLUMN "doubles_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "triples_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "hitsAllowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "runsAllowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "strikes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "pitching_walks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "pitchesThrown" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "pitching_caught_stealing" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "slugging_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "stolen_bases_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "earned_runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" DROP COLUMN "slugging_percentage";--> statement-breakpoint
ALTER TABLE "baseball_team_stats" DROP COLUMN "team_era";--> statement-breakpoint
ALTER TABLE "baseball_team_stats" DROP COLUMN "team_whip";