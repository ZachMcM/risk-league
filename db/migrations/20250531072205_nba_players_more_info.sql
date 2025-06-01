-- migrate:up

ALTER TABLE nba_players
ADD COLUMN height INT,
ADD COLUMN weight INT,
ADD COLUMN number INT

-- migrate:down

