-- migrate:up

ALTER TABLE props ADD COLUMN game_start_time TIMESTAMPTZ;

-- migrate:down

