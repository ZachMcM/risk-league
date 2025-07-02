-- migrate:up

ALTER TABLE props ALTER COLUMN pick_options SET DEFAULT ARRAY['over', 'under'];

-- migrate:down

