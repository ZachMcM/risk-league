-- migrate:up

ALTER TABLE nba_games DROP COLUMN game_id;

-- migrate:down

