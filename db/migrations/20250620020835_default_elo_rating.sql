-- migrate:up

ALTER TABLE users ALTER COLUMN elo_rating SET DEFAULT 1200 

-- migrate:down

