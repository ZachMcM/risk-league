-- migrate:up

ALTER Table matches DROP COLUMN game_mode;
DROP type match_game_mode;

ALTER Table matches ADD COLUMN league TEXT NOT NULL;

-- migrate:down

