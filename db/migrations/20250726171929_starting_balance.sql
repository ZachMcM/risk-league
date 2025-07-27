-- migrate:up

ALTER TABLE match_users ADD COLUMN starting_balance DOUBLE precision DEFAULT 100;

-- migrate:down

