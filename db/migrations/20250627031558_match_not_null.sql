-- migrate:up

ALTER TABLE match_users ALTER COLUMN balance SET NOT NULL;
ALTER TABLE match_users ALTER COLUMN balance SET NOT NULL;
ALTER TABLE match_users ALTER COLUMN elo_delta SET NOT NULL;

-- migrate:down

