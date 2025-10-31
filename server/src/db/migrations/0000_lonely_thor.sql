CREATE TYPE "public"."choice_type" AS ENUM('over', 'under');--> statement-breakpoint
CREATE TYPE "public"."friendly_match_request_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."league_type" AS ENUM('MLB', 'NBA', 'NFL', 'NCAAFB', 'NCAABB');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('not_resolved', 'loss', 'win', 'draw', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."prop_status" AS ENUM('resolved', 'not_resolved', 'did_not_play');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baseball_player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"singles" integer DEFAULT 0 NOT NULL,
	"doubles" integer DEFAULT 0 NOT NULL,
	"triples" integer DEFAULT 0 NOT NULL,
	"at_bats" integer DEFAULT 0 NOT NULL,
	"walks" integer DEFAULT 0 NOT NULL,
	"caught_stealing" integer DEFAULT 0 NOT NULL,
	"home_runs" integer DEFAULT 0 NOT NULL,
	"putouts" integer DEFAULT 0 NOT NULL,
	"stolen_bases" integer DEFAULT 0 NOT NULL,
	"strikeouts" integer DEFAULT 0 NOT NULL,
	"hit_by_pitch" integer DEFAULT 0 NOT NULL,
	"intentional_walks" integer DEFAULT 0 NOT NULL,
	"rbis" integer DEFAULT 0 NOT NULL,
	"outs" integer DEFAULT 0 NOT NULL,
	"hits_allowed" integer DEFAULT 0 NOT NULL,
	"pitching_strikeouts" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"earned_runs" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"runs_allowed" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"singles_allowed" integer DEFAULT 0 NOT NULL,
	"doubles_allowed" integer DEFAULT 0 NOT NULL,
	"triples_allowed" integer DEFAULT 0 NOT NULL,
	"pitching_walks" integer DEFAULT 0 NOT NULL,
	"balks" integer DEFAULT 0 NOT NULL,
	"blown_saves" integer DEFAULT 0 NOT NULL,
	"pitching_caught_stealing" integer DEFAULT 0 NOT NULL,
	"home_runs_allowed" integer DEFAULT 0 NOT NULL,
	"innings_pitched" double precision DEFAULT 0 NOT NULL,
	"pitching_putouts" integer DEFAULT 0 NOT NULL,
	"stolen_bases_allowed" integer DEFAULT 0 NOT NULL,
	"wild_pitches" integer DEFAULT 0 NOT NULL,
	"pitching_hit_by_pitch" integer DEFAULT 0 NOT NULL,
	"holds" integer DEFAULT 0 NOT NULL,
	"pitching_intentional_walks" integer DEFAULT 0 NOT NULL,
	"pitches_thrown" integer DEFAULT 0 NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"game_id" text NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	"status" text NOT NULL,
	"batting_avg" double precision DEFAULT 0 NOT NULL,
	"obp" double precision DEFAULT 0 NOT NULL,
	"slugging_pct" double precision DEFAULT 0 NOT NULL,
	"ops" double precision DEFAULT 0 NOT NULL,
	"hits_runs_rbis" integer DEFAULT 0 NOT NULL,
	"era" double precision DEFAULT 0 NOT NULL,
	"whip" double precision DEFAULT 0 NOT NULL,
	"k_per_nine" double precision DEFAULT 0 NOT NULL,
	"strike_pct" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baseball_team_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"doubles" integer DEFAULT 0 NOT NULL,
	"triples" integer DEFAULT 0 NOT NULL,
	"at_bats" integer DEFAULT 0 NOT NULL,
	"walks" integer DEFAULT 0 NOT NULL,
	"caught_stealing" integer DEFAULT 0 NOT NULL,
	"home_runs" integer DEFAULT 0 NOT NULL,
	"stolen_bases" integer DEFAULT 0 NOT NULL,
	"strikeouts" integer DEFAULT 0 NOT NULL,
	"rbis" integer DEFAULT 0 NOT NULL,
	"team_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	"game_id" text NOT NULL,
	"home_runs_allowed" integer DEFAULT 0 NOT NULL,
	"doubles_allowed" integer DEFAULT 0 NOT NULL,
	"triples_allowed" integer DEFAULT 0 NOT NULL,
	"hits_allowed" integer DEFAULT 0 NOT NULL,
	"runs_allowed" integer DEFAULT 0 NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"pitching_walks" integer DEFAULT 0 NOT NULL,
	"pitches_thrown" integer DEFAULT 0 NOT NULL,
	"pitching_strikeouts" integer DEFAULT 0 NOT NULL,
	"batting_avg" double precision DEFAULT 0 NOT NULL,
	"on_base_percentage" double precision DEFAULT 0 NOT NULL,
	"pitching_caught_stealing" integer DEFAULT 0 NOT NULL,
	"slugging_pct" double precision DEFAULT 0 NOT NULL,
	"ops" double precision DEFAULT 0 NOT NULL,
	"stolen_bases_allowed" integer DEFAULT 0 NOT NULL,
	"earned_runs" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basketball_player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"game_id" text NOT NULL,
	"team_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	"fouls" integer DEFAULT 0 NOT NULL,
	"blocks" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"steals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"minutes" double precision DEFAULT 0 NOT NULL,
	"turnovers" integer DEFAULT 0 NOT NULL,
	"rebounds" integer DEFAULT 0 NOT NULL,
	"two_points_made" integer DEFAULT 0 NOT NULL,
	"field_goals_made" integer DEFAULT 0 NOT NULL,
	"free_throws_made" integer DEFAULT 0 NOT NULL,
	"three_points_made" integer DEFAULT 0 NOT NULL,
	"defensive_rebounds" integer DEFAULT 0 NOT NULL,
	"offensive_rebounds" integer DEFAULT 0 NOT NULL,
	"two_point_percentage" double precision DEFAULT 0 NOT NULL,
	"two_points_attempted" integer DEFAULT 0 NOT NULL,
	"field_goals_attempted" integer DEFAULT 0 NOT NULL,
	"free_throws_attempted" integer DEFAULT 0 NOT NULL,
	"three_points_attempted" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"true_shooting_pct" double precision DEFAULT 0 NOT NULL,
	"usage_rate" double precision DEFAULT 0 NOT NULL,
	"rebounds_pct" double precision DEFAULT 0 NOT NULL,
	"assists_pct" double precision DEFAULT 0 NOT NULL,
	"blocks_pct" double precision DEFAULT 0 NOT NULL,
	"steals_pct" double precision DEFAULT 0 NOT NULL,
	"three_pct" double precision DEFAULT 0 NOT NULL,
	"free_throw_pct" double precision DEFAULT 0 NOT NULL,
	"points_rebounds_assists" integer DEFAULT 0 NOT NULL,
	"points_rebounds" integer DEFAULT 0 NOT NULL,
	"points_assists" integer DEFAULT 0 NOT NULL,
	"rebounds_assists" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basketball_team_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"game_id" text NOT NULL,
	"league" "league_type" NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"fouls" integer DEFAULT 0 NOT NULL,
	"blocks" integer DEFAULT 0 NOT NULL,
	"steals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"turnovers" integer DEFAULT 0 NOT NULL,
	"rebounds" integer DEFAULT 0 NOT NULL,
	"two_points_made" integer DEFAULT 0 NOT NULL,
	"field_goals_made" integer DEFAULT 0 NOT NULL,
	"free_throws_made" integer DEFAULT 0 NOT NULL,
	"three_points_made" integer DEFAULT 0 NOT NULL,
	"defensive_rebounds" integer DEFAULT 0 NOT NULL,
	"offensive_rebounds" integer DEFAULT 0 NOT NULL,
	"two_point_percentage" double precision DEFAULT 0 NOT NULL,
	"two_points_attempted" integer DEFAULT 0 NOT NULL,
	"field_goals_attempted" integer DEFAULT 0 NOT NULL,
	"free_throws_attempted" integer DEFAULT 0 NOT NULL,
	"three_points_attempted" integer DEFAULT 0 NOT NULL,
	"pace" double precision DEFAULT 0 NOT NULL,
	"offensive_rating" double precision DEFAULT 0 NOT NULL,
	"defensive_rating" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "football_player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"game_id" text NOT NULL,
	"league" "league_type" NOT NULL,
	"completions" integer DEFAULT 0 NOT NULL,
	"fumbles_lost" integer DEFAULT 0 NOT NULL,
	"rushing_long" double precision DEFAULT 0 NOT NULL,
	"receiving_long" double precision DEFAULT 0 NOT NULL,
	"passer_rating" double precision DEFAULT 0 NOT NULL,
	"passing_yards" double precision DEFAULT 0 NOT NULL,
	"rushing_yards" double precision DEFAULT 0 NOT NULL,
	"receiving_yards" double precision DEFAULT 0 NOT NULL,
	"passing_attempts" integer DEFAULT 0 NOT NULL,
	"rushing_attempts" integer DEFAULT 0 NOT NULL,
	"fumble_recoveries" integer DEFAULT 0 NOT NULL,
	"passing_touchdowns" integer DEFAULT 0 NOT NULL,
	"rushing_touchdowns" integer DEFAULT 0 NOT NULL,
	"receiving_touchdowns" integer DEFAULT 0 NOT NULL,
	"passing_interceptions" integer DEFAULT 0 NOT NULL,
	"receptions" integer DEFAULT 0 NOT NULL,
	"field_goals_attempted" integer DEFAULT 0 NOT NULL,
	"field_goals_made" integer DEFAULT 0 NOT NULL,
	"field_goals_long" double precision DEFAULT 0 NOT NULL,
	"extra_points_attempted" integer DEFAULT 0 NOT NULL,
	"extra_points_made" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'INACT' NOT NULL,
	"completion_pct" double precision DEFAULT 0 NOT NULL,
	"yards_per_attempt" double precision DEFAULT 0 NOT NULL,
	"yards_per_completion" double precision DEFAULT 0 NOT NULL,
	"yards_per_carry" double precision DEFAULT 0 NOT NULL,
	"yards_per_reception" double precision DEFAULT 0 NOT NULL,
	"field_goal_pct" double precision DEFAULT 0 NOT NULL,
	"extra_point_pct" double precision DEFAULT 0 NOT NULL,
	"receiving_rushing_touchdowns" integer DEFAULT 0 NOT NULL,
	"passing_rushing_touchdowns" integer DEFAULT 0 NOT NULL,
	"total_yards" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "football_team_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"game_id" text NOT NULL,
	"league" "league_type" NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"sacks" double precision DEFAULT 0 NOT NULL,
	"safeties" integer DEFAULT 0 NOT NULL,
	"penalties_total" integer DEFAULT 0 NOT NULL,
	"penalties_yards" integer DEFAULT 0 NOT NULL,
	"turnovers" integer DEFAULT 0 NOT NULL,
	"first_downs" integer DEFAULT 0 NOT NULL,
	"total_yards" double precision DEFAULT 0 NOT NULL,
	"blocked_kicks" integer DEFAULT 0 NOT NULL,
	"blocked_punts" integer DEFAULT 0 NOT NULL,
	"passing_yards" integer DEFAULT 0 NOT NULL,
	"punts_blocked" integer DEFAULT 0 NOT NULL,
	"rushing_yards" integer DEFAULT 0 NOT NULL,
	"defense_touchdowns" integer DEFAULT 0 NOT NULL,
	"defense_interceptions" integer DEFAULT 0 NOT NULL,
	"kick_return_touchdowns" integer DEFAULT 0 NOT NULL,
	"punt_return_touchdowns" integer DEFAULT 0 NOT NULL,
	"blocked_kick_touchdowns" integer DEFAULT 0 NOT NULL,
	"blocked_punt_touchdowns" integer DEFAULT 0 NOT NULL,
	"interception_touchdowns" integer DEFAULT 0 NOT NULL,
	"fumble_return_touchdowns" integer DEFAULT 0 NOT NULL,
	"defense_fumble_recoveries" integer DEFAULT 0 NOT NULL,
	"field_goal_return_touchdowns" integer DEFAULT 0 NOT NULL,
	"two_point_conversion_returns" integer DEFAULT 0 NOT NULL,
	"two_point_conversion_attempts" integer DEFAULT 0 NOT NULL,
	"two_point_conversion_succeeded" integer DEFAULT 0 NOT NULL,
	"points_against_defense_special_teams" integer DEFAULT 0 NOT NULL,
	"passing_touchdowns" integer DEFAULT 0 NOT NULL,
	"rushing_touchdowns" integer DEFAULT 0 NOT NULL,
	"passing_yards_allowed" integer DEFAULT 0 NOT NULL,
	"rushing_yards_allowed" integer DEFAULT 0 NOT NULL,
	"completions_allowed" integer DEFAULT 0 NOT NULL,
	"completions" integer DEFAULT 0 NOT NULL,
	"passing_touchdowns_allowed" integer DEFAULT 0 NOT NULL,
	"rushing_touchdowns_allowed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendly_match_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"incoming_id" text NOT NULL,
	"outgoing_id" text NOT NULL,
	"status" "friendly_match_request_status" DEFAULT 'pending' NOT NULL,
	"league" "league_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendship" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"incoming_id" text NOT NULL,
	"outgoing_id" text NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "friendship_outgoing_id_incoming_id_pk" PRIMARY KEY("outgoing_id","incoming_id")
);
--> statement-breakpoint
CREATE TABLE "game" (
	"game_id" text NOT NULL,
	"start_time" timestamp with time zone,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	CONSTRAINT "game_game_id_league_pk" PRIMARY KEY("game_id","league")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"created_at" timestamp with time zone NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"league" "league_type" NOT NULL,
	"type" text DEFAULT 'competitive' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_user" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"points_delta" double precision DEFAULT 0 NOT NULL,
	"status" "match_status" DEFAULT 'not_resolved' NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"match_id" integer NOT NULL,
	"points_snapshot" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick" (
	"choice" "choice_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"match_user_id" integer NOT NULL,
	"prop_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"player_id" integer NOT NULL,
	"status" text NOT NULL,
	"name" text NOT NULL,
	"team_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	"position" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"height" text,
	"weight" integer,
	"number" integer,
	"image" text,
	CONSTRAINT "player_player_id_league_pk" PRIMARY KEY("player_id","league")
);
--> statement-breakpoint
CREATE TABLE "prop" (
	"id" serial PRIMARY KEY NOT NULL,
	"line" double precision NOT NULL,
	"current_value" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stat_name" text NOT NULL,
	"stat_display_name" text NOT NULL,
	"status" "prop_status" DEFAULT 'not_resolved' NOT NULL,
	"choices" text[] DEFAULT '{"over","under"}' NOT NULL,
	"player_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	"game_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_id" integer NOT NULL,
	"league" "league_type" NOT NULL,
	"full_name" text NOT NULL,
	"abbreviation" text,
	"location" text,
	"mascot" text,
	"arena" text,
	"conference" text,
	"image" text,
	"color" text,
	"alternate_color" text,
	CONSTRAINT "team_team_id_league_pk" PRIMARY KEY("team_id","league")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"username" text,
	"display_username" text,
	"points" double precision DEFAULT 1000 NOT NULL,
	"banner" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"expo_push_token" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD CONSTRAINT "fk_player_baseball_player_stats" FOREIGN KEY ("player_id","league") REFERENCES "public"."player"("player_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD CONSTRAINT "fk_game_baseball_player_stats" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD CONSTRAINT "fk_team_baseball_player_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD CONSTRAINT "fk_team_baseball_team_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD CONSTRAINT "fk_game_baseball_team_stats" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD CONSTRAINT "fk_player_basketball_player_stats" FOREIGN KEY ("player_id","league") REFERENCES "public"."player"("player_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD CONSTRAINT "fk_game_basketball_player_stats" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basketball_player_stats" ADD CONSTRAINT "fk_team_basketball_player_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basketball_team_stats" ADD CONSTRAINT "fk_team_basketball_team_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basketball_team_stats" ADD CONSTRAINT "fk_game_basketball_team_stats" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD CONSTRAINT "fk_player_football_player_stats" FOREIGN KEY ("player_id","league") REFERENCES "public"."player"("player_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD CONSTRAINT "fk_game_football_player_stats" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_player_stats" ADD CONSTRAINT "fk_team_football_player_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_team_stats" ADD CONSTRAINT "fk_team_football_team_stats" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_team_stats" ADD CONSTRAINT "fk_game_football_team_stats" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendly_match_request" ADD CONSTRAINT "friendly_match_request_incoming_id_user_id_fk" FOREIGN KEY ("incoming_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendly_match_request" ADD CONSTRAINT "friendly_match_request_outgoing_id_user_id_fk" FOREIGN KEY ("outgoing_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_incoming_id_user_id_fk" FOREIGN KEY ("incoming_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_outgoing_id_user_id_fk" FOREIGN KEY ("outgoing_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "fk_home_team_game" FOREIGN KEY ("home_team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "fk_away_team_game" FOREIGN KEY ("away_team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user" ADD CONSTRAINT "match_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user" ADD CONSTRAINT "match_user_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick" ADD CONSTRAINT "pick_match_user_id_match_user_id_fk" FOREIGN KEY ("match_user_id") REFERENCES "public"."match_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick" ADD CONSTRAINT "pick_prop_id_prop_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."prop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "fk_team_player" FOREIGN KEY ("team_id","league") REFERENCES "public"."team"("team_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prop" ADD CONSTRAINT "fk_game_prop" FOREIGN KEY ("game_id","league") REFERENCES "public"."game"("game_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prop" ADD CONSTRAINT "fk_player_prop" FOREIGN KEY ("player_id","league") REFERENCES "public"."player"("player_id","league") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "idx_message_created_at" ON "message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pick_prop_id" ON "pick" USING btree ("prop_id");--> statement-breakpoint
CREATE INDEX "idx_player_position_league" ON "player" USING btree ("position","league");--> statement-breakpoint
CREATE INDEX "idx_prop_game_league" ON "prop" USING btree ("game_id","league");--> statement-breakpoint
CREATE INDEX "idx_prop_player_league" ON "prop" USING btree ("player_id","league");--> statement-breakpoint
CREATE INDEX "idx_prop_league_status" ON "prop" USING btree ("league","status");