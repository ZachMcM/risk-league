-- migrate:up

ALTER TABLE nba_props ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- migrate:down

