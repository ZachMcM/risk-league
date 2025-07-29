-- migrate:up

ALTER TABLE match_users elo_rating_snapshot double precision;

-- migrate:down

