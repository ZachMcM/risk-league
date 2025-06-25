-- migrate:up

CREATE TYPE match_result AS ENUM ('win', 'loss', 'draw', 'forfeit');

ALTER TABLE match_users RENAME COLUMN elo_gained TO elo_delta;
ALTER TABLE match_users ADD COLUMN result match_result NOT NULL;

DROP TABLE match_winners;

-- migrate:down

