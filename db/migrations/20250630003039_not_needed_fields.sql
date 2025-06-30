-- migrate:up

ALTER TABLE mlb_player_stats DROP COLUMN is_starter;
ALTER TABLE mlb_player_stats DROP COLUMN batting_order;
ALTER TABLE mlb_player_stats DROP COLUMN is_substitute;

-- migrate:down

