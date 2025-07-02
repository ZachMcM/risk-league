-- migrate:up

ALTER TABLE props ADD COLUMN only_more BOOLEAN DEFAULT FALSE;
ALTER TABLE props ADD COLUMN only_less BOOLEAN DEFAULT FALSE;

-- migrate:down

