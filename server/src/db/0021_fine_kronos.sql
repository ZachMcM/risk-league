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
	"pitching_hits" integer DEFAULT 0 NOT NULL,
	"pitching_strikeouts" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"earned_runs" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"runs_allowed" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"pitching_singles" integer DEFAULT 0 NOT NULL,
	"pitching_doubles" integer DEFAULT 0 NOT NULL,
	"pitching_triples" integer DEFAULT 0 NOT NULL,
	"pitching_walks" integer DEFAULT 0 NOT NULL,
	"balks" integer DEFAULT 0 NOT NULL,
	"blown_saves" integer DEFAULT 0 NOT NULL,
	"pitching_caught_stealing" integer DEFAULT 0 NOT NULL,
	"home_runs_allowed" integer DEFAULT 0 NOT NULL,
	"innings_pitched" integer DEFAULT 0 NOT NULL,
	"pitching_putouts" integer DEFAULT 0 NOT NULL,
	"stolen_bases_allowed" integer DEFAULT 0 NOT NULL,
	"wild_pitches" integer DEFAULT 0 NOT NULL,
	"pitching_hit_by_pitch" integer DEFAULT 0 NOT NULL,
	"holds" integer DEFAULT 0 NOT NULL,
	"pitchingIntentionalWalks" integer DEFAULT 0 NOT NULL,
	"pitchesThrown" integer DEFAULT 0 NOT NULL,
	"strikes" integer DEFAULT 0 NOT NULL,
	"game_id" text,
	"player_id" integer
);
--> statement-breakpoint
CREATE TABLE "baseball_team_stats" (
	"errors" integer DEFAULT 0 NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"doubles" integer DEFAULT 0 NOT NULL,
	"triples" integer DEFAULT 0 NOT NULL,
	"at_bats" integer DEFAULT 0 NOT NULL,
	"walks" integer DEFAULT 0 NOT NULL,
	"caught_stealing" integer DEFAULT 0 NOT NULL,
	"homeRuns" integer DEFAULT 0 NOT NULL,
	"stolen_bases" integer DEFAULT 0 NOT NULL,
	"strikeouts" integer DEFAULT 0 NOT NULL,
	"rbis" integer DEFAULT 0 NOT NULL,
	"team_id" integer,
	"game_id" text
);
--> statement-breakpoint
ALTER TABLE "prop" DROP CONSTRAINT "prop_game_id_game_id_fk";--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "prop" ALTER COLUMN "game_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "prop" ADD CONSTRAINT "prop_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD CONSTRAINT "baseball_player_stats_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD CONSTRAINT "baseball_player_stats_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD CONSTRAINT "baseball_team_stats_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD CONSTRAINT "baseball_team_stats_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;