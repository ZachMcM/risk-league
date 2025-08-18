ALTER TABLE "football_player_stats" RENAME COLUMN "rushingAttempts" TO "rushing_attempts";--> statement-breakpoint
ALTER TABLE "football_player_stats" ALTER COLUMN "fumbles_lost" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "batting_avg" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "obp" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "slugging_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "ops" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "hits_runs_rbis" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "era" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "whip" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "k_per_nine" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "strike_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "home_runs_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "pitching_strikeouts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "batting_avg" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "on_base_percentage" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "slugging_percentage" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "ops" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "team_era" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "team_whip" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "true_shooting_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "usage_rate" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "rebounds_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "assists_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "blocks_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "steals_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "three_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "free_throw_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "points_rebounds_assists" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "points_rebounds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "points_assists" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD COLUMN "rebounds_assists" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_team_stats" ADD COLUMN "pace" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_team_stats" ADD COLUMN "offensive_rating" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "basketball_team_stats" ADD COLUMN "defensive_rating" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "completion_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "yards_per_attempt" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "yards_per_completion" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "yards_per_carry" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "yards_per_reception" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "field_goal_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "extra_point_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "receiving_rushing_touchdowns" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "passing_rushing_touchdowns" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD COLUMN "total_yards" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ADD COLUMN "completions_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ADD COLUMN "passing_touchdowns_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "football_team_stats" ADD COLUMN "rushing_touchdowns_allowed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_baseball_player_stats_player_league" ON "baseball_player_stats" USING btree ("player_id","league");--> statement-breakpoint
CREATE INDEX "idx_baseball_player_stats_game_league" ON "baseball_player_stats" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_baseball_player_stats_league_status" ON "baseball_player_stats" USING btree ("league","status");--> statement-breakpoint
CREATE INDEX "idx_baseball_player_stats_team_league" ON "baseball_player_stats" USING btree ("team_id","league");--> statement-breakpoint
CREATE INDEX "idx_baseball_team_stats_team_league" ON "baseball_team_stats" USING btree ("team_id","league");--> statement-breakpoint
CREATE INDEX "idx_baseball_team_stats_game_league" ON "baseball_team_stats" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_basketball_player_stats_player_league" ON "basketball_player_stats" USING btree ("player_id","league");--> statement-breakpoint
CREATE INDEX "idx_basketball_player_stats_game_league" ON "basketball_player_stats" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_basketball_player_stats_league_status" ON "basketball_player_stats" USING btree ("league","status");--> statement-breakpoint
CREATE INDEX "idx_basketball_player_stats_team_league" ON "basketball_player_stats" USING btree ("team_id","league");--> statement-breakpoint
CREATE INDEX "idx_basketball_team_stats_team_league" ON "basketball_team_stats" USING btree ("team_id","league");--> statement-breakpoint
CREATE INDEX "idx_basketball_team_stats_game_league" ON "basketball_team_stats" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_football_player_stats_player_league" ON "football_player_stats" USING btree ("player_id","league");--> statement-breakpoint
CREATE INDEX "idx_football_player_stats_game_league" ON "football_player_stats" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_football_player_stats_league_status" ON "football_player_stats" USING btree ("league","status");--> statement-breakpoint
CREATE INDEX "idx_football_player_stats_team_league" ON "football_player_stats" USING btree ("team_id","league");--> statement-breakpoint
CREATE INDEX "idx_football_team_stats_team_league" ON "football_team_stats" USING btree ("team_id","league");--> statement-breakpoint
CREATE INDEX "idx_football_team_stats_game_league" ON "football_team_stats" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_game_start_time_league" ON "game" USING btree ("start_time","league");--> statement-breakpoint
CREATE INDEX "idx_match_resolved" ON "match" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_match_league" ON "match" USING btree ("league");--> statement-breakpoint
CREATE INDEX "idx_match_user_user_status" ON "match_user" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_match_user_created_at" ON "match_user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_match_user_match_id" ON "match_user" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_message_match_id" ON "message" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_message_created_at" ON "message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_parlay_match_user_id" ON "parlay" USING btree ("match_user_id");--> statement-breakpoint
CREATE INDEX "idx_parlay_resolved" ON "parlay" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_pick_parlay_id" ON "pick" USING btree ("parlay_id");--> statement-breakpoint
CREATE INDEX "idx_pick_prop_id" ON "pick" USING btree ("prop_id");--> statement-breakpoint
CREATE INDEX "idx_pick_status" ON "pick" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_player_position_league" ON "player" USING btree ("position","league");--> statement-breakpoint
CREATE INDEX "idx_prop_game_league" ON "prop" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_prop_player_league" ON "prop" USING btree ("player_id","league");--> statement-breakpoint
CREATE INDEX "idx_prop_league_resolved" ON "prop" USING btree ("league","resolved");