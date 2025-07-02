-- migrate:up

ALTER TABLE mlb_player_STATS DROP COLUMN era;
ALTER TABLE mlb_player_STATS DROP COLUMN whip;

-- migrate:down

