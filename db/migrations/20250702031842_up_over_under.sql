-- migrate:up

ALTER TABLE props DROP COLUMN only_more;
ALTER TABLE props DROP COLUMN only_less;

ALTER TABLE props ADD COLUMN pick_options TEXT[];

-- migrate:down

