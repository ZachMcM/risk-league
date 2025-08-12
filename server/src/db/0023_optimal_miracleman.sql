ALTER TABLE "baseball_player_stats" DROP CONSTRAINT "baseball_player_stats_game_id_game_id_fk";
--> statement-breakpoint
ALTER TABLE "baseball_player_stats" DROP CONSTRAINT "baseball_player_stats_player_id_player_id_fk";
--> statement-breakpoint
ALTER TABLE "baseball_team_stats" DROP CONSTRAINT "baseball_team_stats_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "baseball_team_stats" DROP CONSTRAINT "baseball_team_stats_game_id_game_id_fk";
--> statement-breakpoint
ALTER TABLE "game" DROP CONSTRAINT "game_home_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "game" DROP CONSTRAINT "game_away_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "player" DROP CONSTRAINT "player_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "prop" DROP CONSTRAINT "prop_player_id_player_id_fk";
--> statement-breakpoint
ALTER TABLE "prop" DROP CONSTRAINT "prop_game_id_game_id_fk";
--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ADD COLUMN "league" "league_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ADD COLUMN "league" "league_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "game_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "player_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "prop" ADD COLUMN "league" "league_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ALTER COLUMN "game_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_player_stats" ALTER COLUMN "player_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "baseball_team_stats" ALTER COLUMN "game_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" DROP CONSTRAINT "game_pkey";--> statement-breakpoint
ALTER TABLE "player" DROP CONSTRAINT "player_pkey";--> statement-breakpoint
ALTER TABLE "team" DROP CONSTRAINT "team_pkey";--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_game_id_league_pk" PRIMARY KEY("game_id","league");--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_player_id_league_pk" PRIMARY KEY("player_id","league");--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_team_id_league_pk" PRIMARY KEY("team_id","league");--> statement-breakpoint
ALTER TABLE "game" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "id";