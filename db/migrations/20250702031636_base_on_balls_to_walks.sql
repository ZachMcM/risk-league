-- migrate:up

ALTER TABLE mlb_games RENAME COLUMN base_on_balls to walks;
ALTER TABLE mlb_player_stats RENAME COLUMN base_on_balls to walks;

-- migrate:down

