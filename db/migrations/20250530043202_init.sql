-- migrate:up

CREATE TABLE nba_teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  pace_rating DECIMAL,
  def_rating DECIMAL,
  off_rating DECIMAL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nba_players (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  team_id TEXT,
  position TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES nba_teams(id)
);

CREATE TABLE nba_games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id TEXT,
  away_team_id TEXT,
  home_score INT,
  away_score INT,
  game_date TIMESTAMP WITH TIME ZONE,
  is_playoff BOOLEAN DEFAULT FALSE,
  round TEXT,
  season_year INT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_home_team FOREIGN KEY (home_team_id) REFERENCES nba_teams(id),
  CONSTRAINT fk_away_team FOREIGN KEY (away_team_id) REFERENCES nba_teams(id)
);

CREATE TABLE nba_player_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT,
  game_id TEXT,
  minutes INT,
  points INT,
  rebounds INT,
  assists INT,
  steals INT,
  blocks INT,
  turnovers INT,
  fga INT,
  fgm INT,
  fta INT,
  ftm INT,
  three_pa INT,
  three_pm INT,
  plus_minus INT,
  usg_rate DECIMAL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES nba_players(id),
  CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES nba_games(id)
);

-- migrate:down
DROP TABLE nba_player_stats;
DROP TABLE nba_games;
DROP TABLE nba_players;
DROP TABLE nba_teams;
