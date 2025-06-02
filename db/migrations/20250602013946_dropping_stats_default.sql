-- migrate:up

ALTER TABLE nba_player_stats ALTER column id DROP DEFAULT;

-- migrate:down

