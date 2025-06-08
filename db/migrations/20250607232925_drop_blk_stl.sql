-- migrate:up

ALTER TABLE nba_player_stats DROP COLUMN stl_pct;
ALTER TABLE nba_player_stats DROP COLUMN blk_pct;

-- migrate:down

