-- migrate:up

ALTER TABLE nba_player_stats ADD COLUMN true_shooting NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN usage_rate NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN reb_pct NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN dreb_pct NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN oreb_pct NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN ast_pct NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN ast_ratio NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN blk_pct NUMERIC;
ALTER TABLE nba_player_stats ADD COLUMN tov_ratio NUMERIC;

ALTER TABLE nba_games ADD COLUMN pace NUMERIC;
ALTER TABLE nba_games ADD COLUMN tov_ratio NUMERIC; 
ALTER TABLE nba_games ADD COLUMN tov_pct NUMERIC;
ALTER TABLE nba_games ADD COLUMN off_rating NUMERIC;
ALTER TABLE nba_games ADD COLUMN def_rating NUMERIC;

-- migrate:down

