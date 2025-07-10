-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."league_type" AS ENUM('nba', 'nfl', 'mlb');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('not_resolved', 'loss', 'win', 'draw', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."parlay_status" AS ENUM('hit', 'missed', 'not_resolved');--> statement-breakpoint
CREATE TYPE "public"."pick_status" AS ENUM('hit', 'missed', 'not_resolved');--> statement-breakpoint
CREATE TYPE "public"."pick_type" AS ENUM('over', 'under');--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" varchar PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY NOT NULL,
	"full_name" text,
	"abbreviation" text,
	"nickname" text,
	"city" text,
	"state" text,
	"year_founded" integer,
	"league" "league_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"team_id" integer,
	"position" text,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"height" text,
	"weight" text,
	"number" text,
	"league" "league_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nba_games" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer,
	"pts" integer,
	"game_date" timestamp with time zone,
	"wl" text,
	"matchup" text,
	"min" integer,
	"fgm" integer,
	"fga" integer,
	"fta" integer,
	"ftm" integer,
	"three_pa" integer,
	"three_pm" integer,
	"oreb" integer,
	"dreb" integer,
	"reb" integer,
	"ast" integer,
	"stl" integer,
	"blk" integer,
	"tov" integer,
	"pf" integer,
	"plus_minus" integer,
	"game_type" varchar(20) NOT NULL,
	"season" text,
	"pace" double precision,
	"tov_ratio" double precision,
	"tov_pct" double precision,
	"off_rating" double precision,
	"def_rating" double precision
);
--> statement-breakpoint
CREATE TABLE "users" (
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" text,
	"name" text,
	"is_bot" boolean,
	"elo_rating" double precision DEFAULT 1200 NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	CONSTRAINT "users_username_key" UNIQUE("username"),
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "nba_player_stats" (
	"game_id" text,
	"pts" integer,
	"min" integer,
	"fgm" integer,
	"fga" integer,
	"fta" integer,
	"ftm" integer,
	"three_pa" integer,
	"three_pm" integer,
	"oreb" integer,
	"dreb" integer,
	"reb" integer,
	"ast" integer,
	"stl" integer,
	"blk" integer,
	"tov" integer,
	"pf" integer,
	"plus_minus" integer,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"season" text,
	"true_shooting" double precision,
	"usage_rate" double precision,
	"reb_pct" double precision,
	"dreb_pct" double precision,
	"oreb_pct" double precision,
	"ast_pct" double precision,
	"ast_ratio" double precision,
	"tov_ratio" double precision,
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"resolved" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_users" (
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"balance" double precision DEFAULT 100 NOT NULL,
	"elo_delta" double precision DEFAULT 0 NOT NULL,
	"status" "match_status" DEFAULT 'not_resolved' NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"match_id" integer
);
--> statement-breakpoint
CREATE TABLE "match_messages" (
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"content" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"match_id" integer
);
--> statement-breakpoint
CREATE TABLE "parlays" (
	"status" "parlay_status" DEFAULT 'not_resolved' NOT NULL,
	"stake" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"id" serial PRIMARY KEY NOT NULL,
	"match_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "parlay_picks" (
	"pick" "pick_type" NOT NULL,
	"status" "pick_status" DEFAULT 'not_resolved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"id" serial PRIMARY KEY NOT NULL,
	"parlay_id" integer,
	"prop_id" integer
);
--> statement-breakpoint
CREATE TABLE "props" (
	"line" double precision NOT NULL,
	"current_value" double precision DEFAULT 0 NOT NULL,
	"raw_game_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"stat" text NOT NULL,
	"game_start_time" timestamp with time zone,
	"league" "league_type" NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"pick_options" text[] DEFAULT '{"RAY['over'::text","'under'::tex"}',
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer
);
--> statement-breakpoint
CREATE TABLE "mlb_player_stats" (
	"game_id" text NOT NULL,
	"at_bats" integer,
	"runs" integer,
	"hits" integer,
	"doubles" integer,
	"triples" integer,
	"home_runs" integer,
	"rbi" integer,
	"stolen_bases" integer,
	"caught_stealing" integer,
	"walks" integer,
	"strikeouts" integer,
	"left_on_base" integer,
	"hit_by_pitch" integer,
	"sac_flies" integer,
	"sac_bunts" integer,
	"batting_avg" double precision,
	"on_base_pct" double precision,
	"slugging_pct" double precision,
	"ops" double precision,
	"innings_pitched" double precision,
	"pitching_hits" integer,
	"pitching_runs" integer,
	"earned_runs" integer,
	"pitching_walks" integer,
	"pitching_strikeouts" integer,
	"pitching_home_runs" integer,
	"pitches_thrown" integer,
	"strikes" integer,
	"balls" integer,
	"season" text,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer
);
--> statement-breakpoint
CREATE TABLE "mlb_games" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer,
	"game_date" timestamp with time zone,
	"game_type" varchar(10) NOT NULL,
	"venue_id" integer,
	"venue_name" text,
	"opponent_team_id" integer,
	"is_home" boolean NOT NULL,
	"status" text,
	"runs" integer,
	"opponent_runs" integer,
	"win_loss" varchar(1),
	"hits" integer,
	"doubles" integer,
	"triples" integer,
	"home_runs" integer,
	"rbi" integer,
	"stolen_bases" integer,
	"caught_stealing" integer,
	"walks" integer,
	"strikeouts" integer,
	"left_on_base" integer,
	"batting_avg" double precision,
	"on_base_pct" double precision,
	"slugging_pct" double precision,
	"ops" double precision,
	"at_bats" integer,
	"plate_appearances" integer,
	"total_bases" integer,
	"hit_by_pitch" integer,
	"sac_flies" integer,
	"sac_bunts" integer,
	"innings_pitched" double precision,
	"earned_runs" integer,
	"pitching_hits" integer,
	"pitching_home_runs" integer,
	"pitching_walks" integer,
	"pitching_strikeouts" integer,
	"era" double precision,
	"whip" double precision,
	"pitches_thrown" integer,
	"strikes" integer,
	"balls" integer,
	"errors" integer,
	"assists" integer,
	"putouts" integer,
	"fielding_chances" integer,
	"passed_balls" integer,
	"season" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "fk_team" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nba_games" ADD CONSTRAINT "fk_team" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nba_player_stats" ADD CONSTRAINT "fk_game" FOREIGN KEY ("game_id") REFERENCES "public"."nba_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nba_player_stats" ADD CONSTRAINT "fk_player" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_users" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_users" ADD CONSTRAINT "fk_match" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_messages" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_messages" ADD CONSTRAINT "fk_match" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlays" ADD CONSTRAINT "fk_match_user" FOREIGN KEY ("match_user_id") REFERENCES "public"."match_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay_picks" ADD CONSTRAINT "fk_parlay" FOREIGN KEY ("parlay_id") REFERENCES "public"."parlays"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay_picks" ADD CONSTRAINT "fk_prop" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "props" ADD CONSTRAINT "fk_player" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mlb_player_stats" ADD CONSTRAINT "fk_game" FOREIGN KEY ("game_id") REFERENCES "public"."mlb_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mlb_player_stats" ADD CONSTRAINT "fk_player" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mlb_games" ADD CONSTRAINT "fk_team" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mlb_games" ADD CONSTRAINT "fk_opponent_team" FOREIGN KEY ("opponent_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
*/