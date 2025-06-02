-- migrate:up


CREATE TABLE nba_player_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT,
  game_id TEXT,
  pts INT,
  min INT,
  fgm INT,
  fga INT,
  fta INT,
  ftm INT,
  three_pa INT,
  three_pm INT,
  oreb INT,
  dreb INT,
  reb INT,
  ast INT,
  stl INT,
  blk INT,
  tov INT,
  pf INT,
  plus_minus INT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES nba_players(id),
  CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES nba_games(id)
);

-- migrate:down

