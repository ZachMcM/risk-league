-- migrate:up

ALTER TABLE nba_games ADD COLUMN season TEXT;
ALTER TABLE nba_player_stats ADD COLUMN season TEXT;

-- migrate:down

