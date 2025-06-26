-- migrate:up

CREATE TABLE props (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  line DOUBLE PRECISION NOT NULL,
  current_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id)
);

-- migrate:down

