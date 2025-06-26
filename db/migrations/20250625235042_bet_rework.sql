-- migrate:up

CREATE TYPE pick_type AS ENUM ('over', 'under');

DROP TABLE match_user_nba_picks;

-- migrate:down

