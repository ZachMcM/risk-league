-- migrate:up

ALTER TABLE "nba_player_stats" ALTER COLUMN "player_id" DROP NOT NULL; 

-- migrate:down

