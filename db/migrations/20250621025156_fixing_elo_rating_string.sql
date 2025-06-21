-- migrate:up

ALTER TABLE users ALTER COLUMN elo_rating TYPE NUMERIC

-- migrate:down

