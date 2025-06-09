-- migrate:up

ALTER TABLE nba_player_stats DROP COLUMN true_shooting;
ALTER TABLE nba_player_stats DROP COLUMN usage_rate;
ALTER TABLE nba_player_stats DROP COLUMN reb_pct;
ALTER TABLE nba_player_stats DROP COLUMN dreb_pct;
ALTER TABLE nba_player_stats DROP COLUMN oreb_pct;
ALTER TABLE nba_player_stats DROP COLUMN ast_pct;
ALTER TABLE nba_player_stats DROP COLUMN ast_ratio;
ALTER TABLE nba_player_stats DROP COLUMN tov_ratio;

-- migrate:down

