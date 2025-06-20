-- migrate:up

ALTER TABLE users ADD is_bot BOOLEAN;
ALTER TABLE users ADD elo_rating NUMERIC; 

-- migrate:down

