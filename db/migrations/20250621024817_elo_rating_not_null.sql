-- migrate:up

ALTER TABLE users ALTER COLUMN elo_rating SET NOT NULL;

-- migrate:down

