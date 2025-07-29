-- migrate:up

ALTER TABLE matches ADD COLUMN type TEXT DEFAULT 'competitive' NOT NULL;

-- migrate:down

