-- migrate:up

ALTER TABLE mlb_player_stats DROP COLUMN position;

-- migrate:down

