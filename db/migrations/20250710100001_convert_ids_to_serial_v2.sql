-- migrate:up

-- This migration converts UUID-based IDs to serial integers
-- We'll do this step by step to avoid constraint issues

-- Step 1: Create new columns with integer types
ALTER TABLE users ADD COLUMN new_id SERIAL;
ALTER TABLE matches ADD COLUMN new_id SERIAL;
ALTER TABLE match_users ADD COLUMN new_id SERIAL;
ALTER TABLE match_users ADD COLUMN new_user_id INTEGER;
ALTER TABLE match_users ADD COLUMN new_match_id INTEGER;
ALTER TABLE match_messages ADD COLUMN new_id SERIAL;
ALTER TABLE match_messages ADD COLUMN new_user_id INTEGER;
ALTER TABLE match_messages ADD COLUMN new_match_id INTEGER;
ALTER TABLE parlays ADD COLUMN new_id SERIAL;
ALTER TABLE parlays ADD COLUMN new_match_user_id INTEGER;
ALTER TABLE parlay_picks ADD COLUMN new_id SERIAL;
ALTER TABLE parlay_picks ADD COLUMN new_parlay_id INTEGER;
ALTER TABLE parlay_picks ADD COLUMN new_prop_id INTEGER;
ALTER TABLE props ADD COLUMN new_id SERIAL;
ALTER TABLE props ADD COLUMN new_player_id INTEGER;
ALTER TABLE nba_player_stats ADD COLUMN new_id SERIAL;
ALTER TABLE nba_player_stats ADD COLUMN new_player_id INTEGER;
ALTER TABLE mlb_player_stats ADD COLUMN new_id SERIAL;
ALTER TABLE mlb_player_stats ADD COLUMN new_player_id INTEGER;

-- Step 2: Convert string-based IDs to integers for teams and players
UPDATE teams SET id = id::INTEGER WHERE id ~ '^[0-9]+$';
UPDATE players SET id = id::INTEGER WHERE id ~ '^[0-9]+$';
UPDATE players SET team_id = team_id::INTEGER WHERE team_id ~ '^[0-9]+$';
UPDATE nba_games SET team_id = team_id::INTEGER WHERE team_id ~ '^[0-9]+$';
UPDATE mlb_games SET team_id = team_id::INTEGER WHERE team_id ~ '^[0-9]+$';
UPDATE mlb_games SET opponent_team_id = opponent_team_id::INTEGER WHERE opponent_team_id ~ '^[0-9]+$';

-- Step 3: Populate the new integer columns for foreign key relationships
UPDATE match_users SET 
    new_user_id = users.new_id,
    new_match_id = matches.new_id
FROM users, matches
WHERE match_users.user_id = users.id AND match_users.match_id = matches.id;

UPDATE match_messages SET 
    new_user_id = users.new_id,
    new_match_id = matches.new_id
FROM users, matches
WHERE match_messages.user_id = users.id AND match_messages.match_id = matches.id;

UPDATE parlays SET 
    new_match_user_id = match_users.new_id
FROM match_users
WHERE parlays.match_user_id = match_users.id;

UPDATE props SET 
    new_player_id = players.id::INTEGER
FROM players
WHERE props.player_id = players.id;

UPDATE parlay_picks SET 
    new_parlay_id = parlays.new_id,
    new_prop_id = props.new_id
FROM parlays, props
WHERE parlay_picks.parlay_id = parlays.id AND parlay_picks.prop_id = props.id;

UPDATE nba_player_stats SET 
    new_player_id = players.id::INTEGER
FROM players
WHERE nba_player_stats.player_id = players.id;

UPDATE mlb_player_stats SET 
    new_player_id = players.id::INTEGER
FROM players
WHERE mlb_player_stats.player_id = players.id;

-- Step 4: Drop foreign key constraints
ALTER TABLE match_users DROP CONSTRAINT IF EXISTS fk_user;
ALTER TABLE match_users DROP CONSTRAINT IF EXISTS fk_match;
ALTER TABLE match_messages DROP CONSTRAINT IF EXISTS fk_user;
ALTER TABLE match_messages DROP CONSTRAINT IF EXISTS fk_match;
ALTER TABLE parlays DROP CONSTRAINT IF EXISTS fk_match_user;
ALTER TABLE parlay_picks DROP CONSTRAINT IF EXISTS fk_parlay;
ALTER TABLE parlay_picks DROP CONSTRAINT IF EXISTS fk_prop;
ALTER TABLE props DROP CONSTRAINT IF EXISTS fk_player;
ALTER TABLE nba_player_stats DROP CONSTRAINT IF EXISTS fk_player;
ALTER TABLE mlb_player_stats DROP CONSTRAINT IF EXISTS fk_player;
ALTER TABLE nba_games DROP CONSTRAINT IF EXISTS fk_team;
ALTER TABLE mlb_games DROP CONSTRAINT IF EXISTS fk_team;
ALTER TABLE mlb_games DROP CONSTRAINT IF EXISTS fk_opponent_team;
ALTER TABLE players DROP CONSTRAINT IF EXISTS fk_team;

-- Step 5: Drop old columns and rename new ones
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN new_id TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

ALTER TABLE matches DROP COLUMN id;
ALTER TABLE matches RENAME COLUMN new_id TO id;
ALTER TABLE matches ADD PRIMARY KEY (id);

ALTER TABLE match_users DROP COLUMN id, DROP COLUMN user_id, DROP COLUMN match_id;
ALTER TABLE match_users RENAME COLUMN new_id TO id;
ALTER TABLE match_users RENAME COLUMN new_user_id TO user_id;
ALTER TABLE match_users RENAME COLUMN new_match_id TO match_id;
ALTER TABLE match_users ADD PRIMARY KEY (id);

ALTER TABLE match_messages DROP COLUMN id, DROP COLUMN user_id, DROP COLUMN match_id;
ALTER TABLE match_messages RENAME COLUMN new_id TO id;
ALTER TABLE match_messages RENAME COLUMN new_user_id TO user_id;
ALTER TABLE match_messages RENAME COLUMN new_match_id TO match_id;
ALTER TABLE match_messages ADD PRIMARY KEY (id);

ALTER TABLE parlays DROP COLUMN id, DROP COLUMN match_user_id;
ALTER TABLE parlays RENAME COLUMN new_id TO id;
ALTER TABLE parlays RENAME COLUMN new_match_user_id TO match_user_id;
ALTER TABLE parlays ADD PRIMARY KEY (id);

ALTER TABLE props DROP COLUMN id, DROP COLUMN player_id;
ALTER TABLE props RENAME COLUMN new_id TO id;
ALTER TABLE props RENAME COLUMN new_player_id TO player_id;
ALTER TABLE props ADD PRIMARY KEY (id);

ALTER TABLE parlay_picks DROP COLUMN id, DROP COLUMN parlay_id, DROP COLUMN prop_id;
ALTER TABLE parlay_picks RENAME COLUMN new_id TO id;
ALTER TABLE parlay_picks RENAME COLUMN new_parlay_id TO parlay_id;
ALTER TABLE parlay_picks RENAME COLUMN new_prop_id TO prop_id;
ALTER TABLE parlay_picks ADD PRIMARY KEY (id);

ALTER TABLE nba_player_stats DROP COLUMN id, DROP COLUMN player_id;
ALTER TABLE nba_player_stats RENAME COLUMN new_id TO id;
ALTER TABLE nba_player_stats RENAME COLUMN new_player_id TO player_id;
ALTER TABLE nba_player_stats ADD PRIMARY KEY (id);

ALTER TABLE mlb_player_stats DROP COLUMN id, DROP COLUMN player_id;
ALTER TABLE mlb_player_stats RENAME COLUMN new_id TO id;
ALTER TABLE mlb_player_stats RENAME COLUMN new_player_id TO player_id;
ALTER TABLE mlb_player_stats ADD PRIMARY KEY (id);

-- Step 6: Update column types for teams and players to INTEGER
ALTER TABLE teams ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE players ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE players ALTER COLUMN team_id TYPE INTEGER USING team_id::INTEGER;
ALTER TABLE nba_games ALTER COLUMN team_id TYPE INTEGER USING team_id::INTEGER;
ALTER TABLE mlb_games ALTER COLUMN team_id TYPE INTEGER USING team_id::INTEGER;
ALTER TABLE mlb_games ALTER COLUMN opponent_team_id TYPE INTEGER USING opponent_team_id::INTEGER;

-- Step 7: Re-add foreign key constraints
ALTER TABLE match_users ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE match_users ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES matches(id);
ALTER TABLE match_messages ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE match_messages ADD CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES matches(id);
ALTER TABLE parlays ADD CONSTRAINT fk_match_user FOREIGN KEY (match_user_id) REFERENCES match_users(id);
ALTER TABLE parlay_picks ADD CONSTRAINT fk_parlay FOREIGN KEY (parlay_id) REFERENCES parlays(id);
ALTER TABLE parlay_picks ADD CONSTRAINT fk_prop FOREIGN KEY (prop_id) REFERENCES props(id);
ALTER TABLE props ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE nba_player_stats ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE mlb_player_stats ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE nba_games ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE mlb_games ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE mlb_games ADD CONSTRAINT fk_opponent_team FOREIGN KEY (opponent_team_id) REFERENCES teams(id);
ALTER TABLE players ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id);

-- migrate:down

-- This migration cannot be safely rolled back as it would require regenerating UUIDs
SELECT 'This migration cannot be rolled back safely' as warning;