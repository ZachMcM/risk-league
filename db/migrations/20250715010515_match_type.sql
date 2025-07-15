-- migrate:up

CREATE TYPE match_game_mode AS ENUM (
    'nba',
    'nfl',
    'mlb'
);

ALTER TABLE matches ADD COLUMN game_mode match_game_mode NOT NULL;

-- migrate:down

