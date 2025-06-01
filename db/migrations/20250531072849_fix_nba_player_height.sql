-- migrate:up

ALTER TABLE nba_players
ALTER COLUMN height TYPE TEXT;

-- migrate:down

