-- migrate:up

ALTER TABLE nba_games ADD COLUMN game_type VARCHAR(20) NOT NULL DEFAULT 'regular';

-- migrate:down

