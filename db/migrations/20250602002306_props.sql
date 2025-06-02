-- migrate:up

CREATE TABLE props (
  id TEXT PRIMARY KEY,
  statistic TEXT NOT NULL,
  player_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES nba_players(id),
  CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES nba_games(id)
);

-- migrate:down

