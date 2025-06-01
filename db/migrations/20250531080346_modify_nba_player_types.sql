-- migrate:up

ALTER TABLE nba_players ALTER column weight TYPE TEXT;
ALTER TABLE nba_players ALTER column number TYPE TEXT;

-- migrate:down

