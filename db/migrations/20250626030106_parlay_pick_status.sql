-- migrate:up

CREATE TYPE pick_status AS ENUM ('in_progress', 'hit', 'missed');

ALTER TABLE parlay_picks ADD COLUMN status pick_status NOT NULL DEFAULT 'in_progress';

-- migrate:down

