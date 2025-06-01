-- migrate:up

ALTER TABLE nba_games ADD COLUMN game_id TEXT;

-- migrate:down

