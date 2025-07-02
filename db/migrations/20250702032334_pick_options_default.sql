-- migrate:up

ALTER TABLE props ALTER COLUMN pick_options SET DEFAULT '{over,under}';

-- migrate:down

ALTER TABLE props ALTER COLUMN pick_options DROP DEFAULT;
