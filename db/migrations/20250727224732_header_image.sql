-- migrate:up

ALTER TABLE users ADD COLUMN header TEXT;

-- migrate:down

