-- migrate:up

ALTER TABLE match_users ADD COLUMN elo_rating_snapshot double precision;

-- migrate:down

