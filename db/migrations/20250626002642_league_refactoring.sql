-- migrate:up

CREATE TYPE league_type AS ENUM ('nba', 'nfl', 'mlb');

ALTER TABLE nba_players DROP CONSTRAINT fk_team;
ALTER TABLE nba_games DROP CONSTRAINT fk_team;
ALTER TABLE nba_player_stats DROP CONSTRAINT fk_player;
ALTER TABLE nba_props DROP CONSTRAINT fk_player;

ALTER TABLE nba_teams RENAME TO teams;
ALTER TABLE nba_players RENAME TO players;

ALTER TABLE teams ADD COLUMN league league_type NOT NULL DEFAULT 'nba';
ALTER TABLE players ADD COLUMN league league_type NOT NULL DEFAULT 'nba';

DROP TABLE nba_props;

ALTER TABLE nba_games
  ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id);

ALTER TABLE players
  ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id);

ALTER TABLE nba_player_stats
  ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id);

-- migrate:down

