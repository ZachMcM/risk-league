-- migrate:up

ALTER TABLE matches DROP COLUMN ends_at;

CREATE TABLE match_winners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT,
  winner_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES matches(id),
  CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- migrate:down

