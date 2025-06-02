-- migrate:up

CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  image TEXT
);

drop TABLE props;

CREATE TABLE nba_props (
  id TEXT PRIMARY KEY,
  stat_type TEXT NOT NULL,
  player_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  line NUMERIC NOT NULL,
  current_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES nba_players(id),
  CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES nba_games(id)
);

create TABLE user_nba_prop_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  prop_id TEXT NOT NULL,
  over_under TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_prop FOREIGN KEY (prop_id) REFERENCES nba_props(id)
);

-- migrate:down

