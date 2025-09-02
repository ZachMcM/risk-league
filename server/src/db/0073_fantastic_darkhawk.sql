ALTER TABLE "dynasty_league" ADD COLUMN "min_total_staked" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dynasty_league" ADD COLUMN "min_parlays" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dynasty_league" DROP COLUMN "resolved";