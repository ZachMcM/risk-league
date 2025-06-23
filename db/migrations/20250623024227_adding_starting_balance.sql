-- migrate:up

ALTER TABLE match_users ADD COLUMN balance DOUBLE PRECISION DEFAULT 100

-- migrate:down

