-- migrate:up

ALTER TABLE nba_games ALTER COLUMN game_type DROP DEFAULT;

-- migrate:down

