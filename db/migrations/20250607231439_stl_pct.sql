-- migrate:up

ALTER TABLE nba_player_stats ADD COLUMN stl_pct NUMERIC;

-- migrate:down

