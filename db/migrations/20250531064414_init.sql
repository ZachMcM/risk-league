-- migrate:up

-- migrate:up

CREATE TABLE nba_teams (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  abbreviation TEXT,
  nickname TEXT,
  city TEXT,
  state TEXT,
  year_founded INT
);

CREATE TABLE nba_players (
  id TEXT PRIMARY KEY,
  name TEXT,
  team_id TEXT,
  position TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES nba_teams(id)
);

CREATE TABLE nba_games (
  id TEXT PRIMARY KEY,
  team_id TEXT,
  pts INT,
  game_date TIMESTAMP WITH TIME ZONE,
  wl TEXT,
  matchup TEXT,
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
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES nba_teams(id)
);

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

