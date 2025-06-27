from sqlalchemy import Boolean, Column, DateTime, Double, Enum, ForeignKeyConstraint, Integer, MetaData, PrimaryKeyConstraint, String, Table, Text, UniqueConstraint, text

metadata = MetaData()


t_matches = Table(
    'matches', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('resolved', Boolean, nullable=False, server_default=text('false')),
    PrimaryKeyConstraint('id', name='matches_pkey')
)

t_schema_migrations = Table(
    'schema_migrations', metadata,
    Column('version', String, primary_key=True),
    PrimaryKeyConstraint('version', name='schema_migrations_pkey')
)

t_teams = Table(
    'teams', metadata,
    Column('id', Text, primary_key=True),
    Column('full_name', Text),
    Column('abbreviation', Text),
    Column('nickname', Text),
    Column('city', Text),
    Column('state', Text),
    Column('year_founded', Integer),
    Column('league', Enum('nba', 'nfl', 'mlb', name='league_type'), nullable=False),
    PrimaryKeyConstraint('id', name='nba_teams_pkey')
)

t_users = Table(
    'users', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('username', Text, nullable=False),
    Column('email', Text, nullable=False),
    Column('password_hash', Text, nullable=False),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('image', Text),
    Column('name', Text),
    Column('is_bot', Boolean),
    Column('elo_rating', Double(53), nullable=False, server_default=text('1200')),
    PrimaryKeyConstraint('id', name='users_pkey'),
    UniqueConstraint('email', name='users_email_key'),
    UniqueConstraint('username', name='users_username_key')
)

t_match_messages = Table(
    'match_messages', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('user_id', Text, nullable=False),
    Column('match_id', Text, nullable=False),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('content', Text, nullable=False),
    ForeignKeyConstraint(['match_id'], ['matches.id'], name='fk_match'),
    ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user'),
    PrimaryKeyConstraint('id', name='match_messages_pkey')
)

t_match_users = Table(
    'match_users', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('match_id', Text),
    Column('user_id', Text),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('balance', Double(53), nullable=False, server_default=text('100')),
    Column('elo_delta', Double(53), nullable=False, server_default=text('0')),
    Column('status', Enum('in_progress', 'loss', 'win', 'draw', name='match_status'), nullable=False, server_default=text("'in_progress'::match_status")),
    ForeignKeyConstraint(['match_id'], ['matches.id'], name='fk_match'),
    ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user'),
    PrimaryKeyConstraint('id', name='match_users_pkey')
)

t_nba_games = Table(
    'nba_games', metadata,
    Column('id', Text, primary_key=True),
    Column('team_id', Text),
    Column('pts', Integer),
    Column('game_date', DateTime(True)),
    Column('wl', Text),
    Column('matchup', Text),
    Column('min', Integer),
    Column('fgm', Integer),
    Column('fga', Integer),
    Column('fta', Integer),
    Column('ftm', Integer),
    Column('three_pa', Integer),
    Column('three_pm', Integer),
    Column('oreb', Integer),
    Column('dreb', Integer),
    Column('reb', Integer),
    Column('ast', Integer),
    Column('stl', Integer),
    Column('blk', Integer),
    Column('tov', Integer),
    Column('pf', Integer),
    Column('plus_minus', Integer),
    Column('game_type', String(20), nullable=False),
    Column('season', Text),
    Column('pace', Double(53)),
    Column('tov_ratio', Double(53)),
    Column('tov_pct', Double(53)),
    Column('off_rating', Double(53)),
    Column('def_rating', Double(53)),
    ForeignKeyConstraint(['team_id'], ['teams.id'], name='fk_team'),
    PrimaryKeyConstraint('id', name='nba_games_pkey')
)

t_players = Table(
    'players', metadata,
    Column('id', Text, primary_key=True),
    Column('name', Text),
    Column('team_id', Text),
    Column('position', Text),
    Column('updated_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('height', Text),
    Column('weight', Text),
    Column('number', Text),
    Column('league', Enum('nba', 'nfl', 'mlb', name='league_type'), nullable=False),
    ForeignKeyConstraint(['team_id'], ['teams.id'], name='fk_team'),
    PrimaryKeyConstraint('id', name='nba_players_pkey')
)

t_nba_player_stats = Table(
    'nba_player_stats', metadata,
    Column('id', Text, primary_key=True),
    Column('player_id', Text),
    Column('game_id', Text),
    Column('pts', Integer),
    Column('min', Integer),
    Column('fgm', Integer),
    Column('fga', Integer),
    Column('fta', Integer),
    Column('ftm', Integer),
    Column('three_pa', Integer),
    Column('three_pm', Integer),
    Column('oreb', Integer),
    Column('dreb', Integer),
    Column('reb', Integer),
    Column('ast', Integer),
    Column('stl', Integer),
    Column('blk', Integer),
    Column('tov', Integer),
    Column('pf', Integer),
    Column('plus_minus', Integer),
    Column('updated_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('season', Text),
    Column('true_shooting', Double(53)),
    Column('usage_rate', Double(53)),
    Column('reb_pct', Double(53)),
    Column('dreb_pct', Double(53)),
    Column('oreb_pct', Double(53)),
    Column('ast_pct', Double(53)),
    Column('ast_ratio', Double(53)),
    Column('tov_ratio', Double(53)),
    ForeignKeyConstraint(['game_id'], ['nba_games.id'], name='fk_game'),
    ForeignKeyConstraint(['player_id'], ['players.id'], name='fk_player'),
    PrimaryKeyConstraint('id', name='nba_player_stats_pkey')
)

t_parlays = Table(
    'parlays', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('match_user_id', Text, nullable=False),
    Column('status', Enum('in_progress', 'hit', 'missed', name='parlay_status_type'), nullable=False, server_default=text("'in_progress'::parlay_status_type")),
    Column('stake', Double(53), nullable=False),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    ForeignKeyConstraint(['match_user_id'], ['match_users.id'], name='fk_match_user'),
    PrimaryKeyConstraint('id', name='parlays_pkey')
)

t_props = Table(
    'props', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('line', Double(53), nullable=False),
    Column('current_value', Double(53), nullable=False, server_default=text('0')),
    Column('raw_game_id', Text, nullable=False),
    Column('player_id', Text, nullable=False),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    Column('stat_type', Text, nullable=False),
    Column('game_start_time', DateTime(True)),
    Column('league', Enum('nba', 'nfl', 'mlb', name='league_type'), nullable=False),
    Column('resolved', Boolean, nullable=False, server_default=text('false')),
    ForeignKeyConstraint(['player_id'], ['players.id'], name='fk_player'),
    PrimaryKeyConstraint('id', name='props_pkey')
)

t_parlay_picks = Table(
    'parlay_picks', metadata,
    Column('id', Text, primary_key=True, server_default=text('gen_random_uuid()')),
    Column('parlay_id', Text, nullable=False),
    Column('prop_id', Text, nullable=False),
    Column('pick', Enum('over', 'under', name='pick_type'), nullable=False),
    Column('status', Enum('in_progress', 'hit', 'missed', name='pick_status'), nullable=False, server_default=text("'in_progress'::pick_status")),
    Column('created_at', DateTime(True), server_default=text('CURRENT_TIMESTAMP')),
    ForeignKeyConstraint(['parlay_id'], ['parlays.id'], name='fk_parlay'),
    ForeignKeyConstraint(['prop_id'], ['props.id'], name='fk_prop'),
    PrimaryKeyConstraint('id', name='parlay_picks_pkey')
)
