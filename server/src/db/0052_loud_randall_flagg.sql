ALTER TABLE "baseball_player_stats" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD CONSTRAINT "fk_team_baseball_player_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD CONSTRAINT "fk_team_basketball_player_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD CONSTRAINT "fk_team_football_player_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE no action ON UPDATE no action;