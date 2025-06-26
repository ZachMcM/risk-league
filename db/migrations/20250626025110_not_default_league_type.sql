-- migrate:up

ALTER TABLE props ALTER COLUMN league DROP DEFAULT;

-- migrate:down

