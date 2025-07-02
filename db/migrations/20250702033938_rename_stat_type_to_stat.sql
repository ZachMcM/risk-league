-- migrate:up

ALTER TABLE props RENAME COLUMN stat_type TO stat;

-- migrate:down

