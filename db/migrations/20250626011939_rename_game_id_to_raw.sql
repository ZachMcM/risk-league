-- migrate:up

ALTER TABLE props RENAME COLUMN game_id to raw_game_id;

-- migrate:down

