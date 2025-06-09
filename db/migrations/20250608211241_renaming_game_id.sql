-- migrate:up

ALTER TABLE nba_props RENAME COLUMN game_id TO raw_game_id;
ALTER TABLE nba_props DROP CONSTRAINT fk_game;

-- migrate:down

