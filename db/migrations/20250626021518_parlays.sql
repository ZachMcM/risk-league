-- migrate:up

create TYPE parlay_status_type AS ENUM ('in_progress', 'hit', 'missed');

ALTER TABLE props ADD COLUMN league league_type NOT NULL DEFAULT 'nba';
ALTER TABLE props ADD COLUMN resolved BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE parlays (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  match_user_id TEXT NOT NULL,
  status parlay_status_type NOT NULL DEFAULT 'in_progress',
  stake DOUBLE PRECISION NOT NULL,
  CONSTRAINT fk_match_user FOREIGN KEY (match_user_id) REFERENCES match_users(id)
);

CREATE TABLE parlay_picks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  parlay_id TEXT NOT NULL,
  prop_id TEXT NOT NULL,
  pick pick_type NOT NULL,
  CONSTRAINT fk_parlay FOREIGN KEY (parlay_id) REFERENCES parlays(id),
  CONSTRAINT fk_prop FOREIGN KEY (prop_id) REFERENCES props(id)
);

-- migrate:down

