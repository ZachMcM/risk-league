-- migrate:up

ALTER TABLE "nba_players" ALTER COLUMN "team_id" DROP NOT NULL;

-- migrate:down

