-- migrate:up

ALTER TABLE users ADD COLUMN name TEXT

-- migrate:down

