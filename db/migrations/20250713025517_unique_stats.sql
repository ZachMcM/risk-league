-- migrate:up

-- Add unique constraint for player_id and game_id combination in mlb_player_stats
ALTER TABLE public.mlb_player_stats 
ADD CONSTRAINT mlb_player_stats_player_game_unique UNIQUE (player_id, game_id);

-- Add unique constraint for player_id and game_id combination in nba_player_stats
ALTER TABLE public.nba_player_stats 
ADD CONSTRAINT nba_player_stats_player_game_unique UNIQUE (player_id, game_id);

-- migrate:down

-- Remove unique constraint from mlb_player_stats
ALTER TABLE public.mlb_player_stats 
DROP CONSTRAINT IF EXISTS mlb_player_stats_player_game_unique;

-- Remove unique constraint from nba_player_stats
ALTER TABLE public.nba_player_stats 
DROP CONSTRAINT IF EXISTS nba_player_stats_player_game_unique;
