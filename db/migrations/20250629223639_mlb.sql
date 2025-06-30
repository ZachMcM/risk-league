-- migrate:up

CREATE TABLE mlb_games (
  id TEXT PRIMARY KEY,
  team_id TEXT,
  game_date TIMESTAMP WITH TIME ZONE,
  game_type VARCHAR(10) NOT NULL,
  
  -- Game info
  venue_id INTEGER,
  venue_name TEXT,
  opponent_team_id TEXT,
  is_home BOOLEAN NOT NULL,
  
  -- Game result
  status TEXT,
  runs INTEGER,
  opponent_runs INTEGER,
  win_loss VARCHAR(1), -- 'W', 'L', or null for incomplete
  
  -- Team batting stats
  hits INTEGER,
  doubles INTEGER,
  triples INTEGER,
  home_runs INTEGER,
  rbi INTEGER,
  stolen_bases INTEGER,
  caught_stealing INTEGER,
  base_on_balls INTEGER,
  strikeouts INTEGER,
  left_on_base INTEGER,
  batting_avg DOUBLE PRECISION,
  on_base_pct DOUBLE PRECISION,
  slugging_pct DOUBLE PRECISION,
  ops DOUBLE PRECISION,
  at_bats INTEGER,
  plate_appearances INTEGER,
  total_bases INTEGER,
  hit_by_pitch INTEGER,
  sac_flies INTEGER,
  sac_bunts INTEGER,
  
  -- Team pitching stats
  innings_pitched DOUBLE PRECISION,
  earned_runs INTEGER,
  pitching_hits INTEGER,
  pitching_home_runs INTEGER,
  pitching_walks INTEGER,
  pitching_strikeouts INTEGER,
  era DOUBLE PRECISION,
  whip DOUBLE PRECISION,
  pitches_thrown INTEGER,
  strikes INTEGER,
  balls INTEGER,
  
  -- Team fielding stats
  errors INTEGER,
  assists INTEGER,
  putouts INTEGER,
  fielding_chances INTEGER,
  passed_balls INTEGER,
  
  -- Metadata
  season TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_opponent_team FOREIGN KEY (opponent_team_id) REFERENCES teams(id)
);

CREATE TABLE mlb_player_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  
  -- Batting stats (null if player didn't bat)
  batting_order INTEGER,
  position TEXT,
  at_bats INTEGER,
  runs INTEGER,
  hits INTEGER,
  doubles INTEGER,
  triples INTEGER,
  home_runs INTEGER,
  rbi INTEGER,
  stolen_bases INTEGER,
  caught_stealing INTEGER,
  base_on_balls INTEGER,
  strikeouts INTEGER,
  left_on_base INTEGER,
  hit_by_pitch INTEGER,
  sac_flies INTEGER,
  sac_bunts INTEGER,
  batting_avg DOUBLE PRECISION,
  on_base_pct DOUBLE PRECISION,
  slugging_pct DOUBLE PRECISION,
  ops DOUBLE PRECISION,
  
  -- Pitching stats (null if player didn't pitch)
  innings_pitched DOUBLE PRECISION,
  pitching_hits INTEGER,
  pitching_runs INTEGER,
  earned_runs INTEGER,
  pitching_walks INTEGER,
  pitching_strikeouts INTEGER,
  pitching_home_runs INTEGER,
  pitches_thrown INTEGER,
  strikes INTEGER,
  balls INTEGER,
  era DOUBLE PRECISION,
  whip DOUBLE PRECISION,
  
  -- Game context
  is_starter BOOLEAN,
  is_substitute BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  season TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id),
  CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES mlb_games(id)
);

-- migrate:down

DROP TABLE IF EXISTS mlb_player_stats;
DROP TABLE IF EXISTS mlb_games;

