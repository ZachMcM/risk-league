-- migrate:up
-- Allow mlb_player_stats.player_id to be nullable to handle cases where player data is not yet available
ALTER TABLE mlb_player_stats ALTER COLUMN player_id DROP NOT NULL;

-- migrate:down
-- Restore NOT NULL constraint on player_id
ALTER TABLE mlb_player_stats ALTER COLUMN player_id SET NOT NULL;