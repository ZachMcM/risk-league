-- migrate:up

CREATE TYPE match_status AS ENUM ('in_progress', 'loss', 'win', 'draw');
ALTER TABLE match_users ADD COLUMN status match_status NOT NULL DEFAULT 'in_progress';

ALTER TABLE match_users DROP COLUMN result;
DROP TYPE match_result;

-- migrate:down

