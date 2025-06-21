-- migrate:up

CREATE TABLE matches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE match_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES matches(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE match_user_nba_picks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  pick TEXT NOT NULL,
  match_user_id TEXT,
  nba_prop_id TEXT,
  CONSTRAINT fk_match_user FOREIGN KEY (match_user_id) REFERENCES match_users(id),
  CONSTRAINT fk_nba_prop FOREIGN KEY (nba_prop_id) REFERENCES nba_props(id)
);

-- migrate:down

