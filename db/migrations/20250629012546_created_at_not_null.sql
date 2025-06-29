-- migrate:up

ALTER TABLE match_messages ALTER COLUMN created_at SET NOT NULL;

-- migrate:down

