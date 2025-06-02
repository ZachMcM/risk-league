-- migrate:up

ALTER TABLE user_nba_prop_entries ADD COLUMN status TEXT;

-- migrate:down

