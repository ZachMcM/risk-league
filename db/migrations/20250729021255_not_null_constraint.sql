-- migrate:up

ALTER TABLE match_users ALTER COLUMN elo_rating_snapshot SET NOT NULL;

-- migrate:down

