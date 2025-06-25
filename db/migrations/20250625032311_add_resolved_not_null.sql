-- migrate:up

ALTER TABLE matches ALTER COLUMN resolved SET NOT NULL;

-- migrate:down

