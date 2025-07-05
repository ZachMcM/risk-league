-- migrate:up

ALTER TABLE mlb_player_stats
ADD CONSTRAINT unique_mlb_player_game
UNIQUE (player_id, game_id);

ALTER TABLE nba_player_stats
ADD CONSTRAINT unique_nba_player_game
UNIQUE (player_id, game_id);

-- migrate:down

