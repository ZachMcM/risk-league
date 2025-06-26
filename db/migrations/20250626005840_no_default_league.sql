-- migrate:up

ALTER TABLE teams ALTER COLUMN league DROP DEFAULT;
ALTER TABLE players ALTER COLUMN league DROP DEFAULT;

-- migrate:down

