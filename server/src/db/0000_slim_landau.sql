CREATE TYPE "public"."choiceType" AS ENUM('over', 'under');--> statement-breakpoint
CREATE TYPE "public"."league_type" AS ENUM('nba', 'nfl', 'mlb');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('not_resolved', 'loss', 'win', 'draw', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."parlay_type" AS ENUM('perfect', 'flex');--> statement-breakpoint
CREATE TYPE "public"."pick_status" AS ENUM('hit', 'missed', 'not_resolved');--> statement-breakpoint
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
CREATE TABLE "game" (
	"id" integer PRIMARY KEY NOT NULL,
	"startTime" timestamp with time zone,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"league" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match" (
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"league" text NOT NULL,
	"type" text DEFAULT 'competitive' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_user" (
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"balance" double precision DEFAULT 100 NOT NULL,
	"elo_delta" double precision DEFAULT 0 NOT NULL,
	"status" "match_status" DEFAULT 'not_resolved' NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"match_id" integer NOT NULL,
	"starting_balance" double precision DEFAULT 100 NOT NULL,
	"points_snapshot" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"content" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parlay" (
	"stake" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"match_user_id" integer NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"delta" double precision DEFAULT 0 NOT NULL,
	"type" "parlay_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick" (
	"choice" "choiceType" NOT NULL,
	"status" "pick_status" DEFAULT 'not_resolved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"parlay_id" integer NOT NULL,
	"prop_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" integer NOT NULL,
	"position" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"height" text NOT NULL,
	"weight" text NOT NULL,
	"number" text NOT NULL,
	"league" "league_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prop" (
	"line" double precision NOT NULL,
	"current_value" double precision DEFAULT 0 NOT NULL,
	"raw_game_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"stat_name" text NOT NULL,
	"state_display_name" text NOT NULL,
	"league" "league_type" NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"choices" text[] DEFAULT '{"over","under"}' NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"game_id" integer NOT NULL
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
	"id" integer PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"nickname" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"year_founded" integer NOT NULL,
	"league" "league_type" NOT NULL
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
	"points" double precision DEFAULT 1200 NOT NULL,
	"header" text,
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
ALTER TABLE "game" ADD CONSTRAINT "game_home_team_id_team_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_away_team_id_team_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user" ADD CONSTRAINT "match_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user" ADD CONSTRAINT "match_user_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay" ADD CONSTRAINT "parlay_match_user_id_match_user_id_fk" FOREIGN KEY ("match_user_id") REFERENCES "public"."match_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick" ADD CONSTRAINT "pick_parlay_id_parlay_id_fk" FOREIGN KEY ("parlay_id") REFERENCES "public"."parlay"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick" ADD CONSTRAINT "pick_prop_id_prop_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."prop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prop" ADD CONSTRAINT "prop_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prop" ADD CONSTRAINT "prop_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;