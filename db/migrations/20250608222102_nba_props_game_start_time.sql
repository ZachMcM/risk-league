-- migrate:up

ALTER TABLE nba_props ADD COLUMN game_start_time TIMESTAMPTZ;

-- migrate:down

