-- migrate:up

ALTER TABLE props ADD COLUMN stat_type TEXT NOT NULL;

-- migrate:down

