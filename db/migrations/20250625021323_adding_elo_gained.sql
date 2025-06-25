-- migrate:up

ALTER TABLE match_users ADD COLUMN elo_gained DOUBLE PRECISION DEFAULT 0

-- migrate:down

