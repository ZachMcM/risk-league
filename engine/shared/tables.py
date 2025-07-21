from typing import List, Optional

from sqlalchemy import ARRAY, Boolean, DateTime, Double, Enum, ForeignKeyConstraint, Integer, PrimaryKeyConstraint, Sequence, String, Text, UniqueConstraint, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime

class Base(DeclarativeBase):
    pass


class Matches(Base):
    __tablename__ = 'matches'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='matches_pkey'),
        {'schema': 'public'}
    )

    resolved: Mapped[bool] = mapped_column(Boolean, server_default=text('false'))
    id: Mapped[int] = mapped_column(Integer, Sequence('matches_new_id_seq', schema='public'), primary_key=True)
    game_mode: Mapped[str] = mapped_column(Enum('nba', 'nfl', 'mlb', name='match_game_mode'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))

    match_messages: Mapped[List['MatchMessages']] = relationship('MatchMessages', back_populates='match')
    match_users: Mapped[List['MatchUsers']] = relationship('MatchUsers', back_populates='match')


class SchemaMigrations(Base):
    __tablename__ = 'schema_migrations'
    __table_args__ = (
        PrimaryKeyConstraint('version', name='schema_migrations_pkey'),
        {'schema': 'public'}
    )

    version: Mapped[str] = mapped_column(String, primary_key=True)


class Teams(Base):
    __tablename__ = 'teams'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='nba_teams_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    league: Mapped[str] = mapped_column(Enum('nba', 'nfl', 'mlb', name='league_type'))
    full_name: Mapped[Optional[str]] = mapped_column(Text)
    abbreviation: Mapped[Optional[str]] = mapped_column(Text)
    nickname: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(Text)
    state: Mapped[Optional[str]] = mapped_column(Text)
    year_founded: Mapped[Optional[int]] = mapped_column(Integer)

    mlb_games: Mapped[List['MlbGames']] = relationship('MlbGames', foreign_keys='[MlbGames.opponent_team_id]', back_populates='opponent_team')
    mlb_games_: Mapped[List['MlbGames']] = relationship('MlbGames', foreign_keys='[MlbGames.team_id]', back_populates='team')
    nba_games: Mapped[List['NbaGames']] = relationship('NbaGames', back_populates='team')
    players: Mapped[List['Players']] = relationship('Players', back_populates='team')


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='users_pkey'),
        UniqueConstraint('email', name='users_email_key'),
        UniqueConstraint('username', name='users_username_key'),
        {'schema': 'public'}
    )

    username: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(Text)
    elo_rating: Mapped[float] = mapped_column(Double(53), server_default=text('1200'))
    id: Mapped[int] = mapped_column(Integer, Sequence('users_new_id_seq', schema='public'), primary_key=True)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    image: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)
    is_bot: Mapped[Optional[bool]] = mapped_column(Boolean)

    match_messages: Mapped[List['MatchMessages']] = relationship('MatchMessages', back_populates='user')
    match_users: Mapped[List['MatchUsers']] = relationship('MatchUsers', back_populates='user')


class MatchMessages(Base):
    __tablename__ = 'match_messages'
    __table_args__ = (
        ForeignKeyConstraint(['match_id'], ['public.matches.id'], name='fk_match'),
        ForeignKeyConstraint(['user_id'], ['public.users.id'], name='fk_user'),
        PrimaryKeyConstraint('id', name='match_messages_pkey'),
        {'schema': 'public'}
    )

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    content: Mapped[str] = mapped_column(Text)
    id: Mapped[int] = mapped_column(Integer, Sequence('match_messages_new_id_seq', schema='public'), primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    match_id: Mapped[Optional[int]] = mapped_column(Integer)

    match: Mapped[Optional['Matches']] = relationship('Matches', back_populates='match_messages')
    user: Mapped[Optional['Users']] = relationship('Users', back_populates='match_messages')


class MatchUsers(Base):
    __tablename__ = 'match_users'
    __table_args__ = (
        ForeignKeyConstraint(['match_id'], ['public.matches.id'], name='fk_match'),
        ForeignKeyConstraint(['user_id'], ['public.users.id'], name='fk_user'),
        PrimaryKeyConstraint('id', name='match_users_pkey'),
        {'schema': 'public'}
    )

    balance: Mapped[float] = mapped_column(Double(53), server_default=text('100'))
    elo_delta: Mapped[float] = mapped_column(Double(53), server_default=text('0'))
    status: Mapped[str] = mapped_column(Enum('not_resolved', 'loss', 'win', 'draw', 'disqualified', name='match_status'), server_default=text("'not_resolved'::match_status"))
    id: Mapped[int] = mapped_column(Integer, Sequence('match_users_new_id_seq', schema='public'), primary_key=True)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    match_id: Mapped[Optional[int]] = mapped_column(Integer)

    match: Mapped[Optional['Matches']] = relationship('Matches', back_populates='match_users')
    user: Mapped[Optional['Users']] = relationship('Users', back_populates='match_users')
    parlays: Mapped[List['Parlays']] = relationship('Parlays', back_populates='match_user')


class MlbGames(Base):
    __tablename__ = 'mlb_games'
    __table_args__ = (
        ForeignKeyConstraint(['opponent_team_id'], ['public.teams.id'], name='fk_opponent_team'),
        ForeignKeyConstraint(['team_id'], ['public.teams.id'], name='fk_team'),
        PrimaryKeyConstraint('id', name='mlb_games_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    game_type: Mapped[str] = mapped_column(String(10))
    is_home: Mapped[bool] = mapped_column(Boolean)
    team_id: Mapped[Optional[int]] = mapped_column(Integer)
    game_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    venue_id: Mapped[Optional[int]] = mapped_column(Integer)
    venue_name: Mapped[Optional[str]] = mapped_column(Text)
    opponent_team_id: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[Optional[str]] = mapped_column(Text)
    runs: Mapped[Optional[int]] = mapped_column(Integer)
    opponent_runs: Mapped[Optional[int]] = mapped_column(Integer)
    win_loss: Mapped[Optional[str]] = mapped_column(String(1))
    hits: Mapped[Optional[int]] = mapped_column(Integer)
    doubles: Mapped[Optional[int]] = mapped_column(Integer)
    triples: Mapped[Optional[int]] = mapped_column(Integer)
    home_runs: Mapped[Optional[int]] = mapped_column(Integer)
    rbi: Mapped[Optional[int]] = mapped_column(Integer)
    stolen_bases: Mapped[Optional[int]] = mapped_column(Integer)
    caught_stealing: Mapped[Optional[int]] = mapped_column(Integer)
    walks: Mapped[Optional[int]] = mapped_column(Integer)
    strikeouts: Mapped[Optional[int]] = mapped_column(Integer)
    left_on_base: Mapped[Optional[int]] = mapped_column(Integer)
    batting_avg: Mapped[Optional[float]] = mapped_column(Double(53))
    on_base_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    slugging_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    ops: Mapped[Optional[float]] = mapped_column(Double(53))
    at_bats: Mapped[Optional[int]] = mapped_column(Integer)
    plate_appearances: Mapped[Optional[int]] = mapped_column(Integer)
    total_bases: Mapped[Optional[int]] = mapped_column(Integer)
    hit_by_pitch: Mapped[Optional[int]] = mapped_column(Integer)
    sac_flies: Mapped[Optional[int]] = mapped_column(Integer)
    sac_bunts: Mapped[Optional[int]] = mapped_column(Integer)
    innings_pitched: Mapped[Optional[float]] = mapped_column(Double(53))
    earned_runs: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_hits: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_home_runs: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_walks: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_strikeouts: Mapped[Optional[int]] = mapped_column(Integer)
    era: Mapped[Optional[float]] = mapped_column(Double(53))
    whip: Mapped[Optional[float]] = mapped_column(Double(53))
    pitches_thrown: Mapped[Optional[int]] = mapped_column(Integer)
    strikes: Mapped[Optional[int]] = mapped_column(Integer)
    balls: Mapped[Optional[int]] = mapped_column(Integer)
    errors: Mapped[Optional[int]] = mapped_column(Integer)
    assists: Mapped[Optional[int]] = mapped_column(Integer)
    putouts: Mapped[Optional[int]] = mapped_column(Integer)
    fielding_chances: Mapped[Optional[int]] = mapped_column(Integer)
    passed_balls: Mapped[Optional[int]] = mapped_column(Integer)
    season: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))

    opponent_team: Mapped[Optional['Teams']] = relationship('Teams', foreign_keys=[opponent_team_id], back_populates='mlb_games')
    team: Mapped[Optional['Teams']] = relationship('Teams', foreign_keys=[team_id], back_populates='mlb_games_')
    mlb_player_stats: Mapped[List['MlbPlayerStats']] = relationship('MlbPlayerStats', back_populates='game')


class NbaGames(Base):
    __tablename__ = 'nba_games'
    __table_args__ = (
        ForeignKeyConstraint(['team_id'], ['public.teams.id'], name='fk_team'),
        PrimaryKeyConstraint('id', name='nba_games_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    game_type: Mapped[str] = mapped_column(String(20))
    team_id: Mapped[Optional[int]] = mapped_column(Integer)
    pts: Mapped[Optional[int]] = mapped_column(Integer)
    game_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    wl: Mapped[Optional[str]] = mapped_column(Text)
    matchup: Mapped[Optional[str]] = mapped_column(Text)
    min: Mapped[Optional[int]] = mapped_column(Integer)
    fgm: Mapped[Optional[int]] = mapped_column(Integer)
    fga: Mapped[Optional[int]] = mapped_column(Integer)
    fta: Mapped[Optional[int]] = mapped_column(Integer)
    ftm: Mapped[Optional[int]] = mapped_column(Integer)
    three_pa: Mapped[Optional[int]] = mapped_column(Integer)
    three_pm: Mapped[Optional[int]] = mapped_column(Integer)
    oreb: Mapped[Optional[int]] = mapped_column(Integer)
    dreb: Mapped[Optional[int]] = mapped_column(Integer)
    reb: Mapped[Optional[int]] = mapped_column(Integer)
    ast: Mapped[Optional[int]] = mapped_column(Integer)
    stl: Mapped[Optional[int]] = mapped_column(Integer)
    blk: Mapped[Optional[int]] = mapped_column(Integer)
    tov: Mapped[Optional[int]] = mapped_column(Integer)
    pf: Mapped[Optional[int]] = mapped_column(Integer)
    plus_minus: Mapped[Optional[int]] = mapped_column(Integer)
    season: Mapped[Optional[str]] = mapped_column(Text)
    pace: Mapped[Optional[float]] = mapped_column(Double(53))
    tov_ratio: Mapped[Optional[float]] = mapped_column(Double(53))
    tov_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    off_rating: Mapped[Optional[float]] = mapped_column(Double(53))
    def_rating: Mapped[Optional[float]] = mapped_column(Double(53))

    team: Mapped[Optional['Teams']] = relationship('Teams', back_populates='nba_games')
    nba_player_stats: Mapped[List['NbaPlayerStats']] = relationship('NbaPlayerStats', back_populates='game')


class Players(Base):
    __tablename__ = 'players'
    __table_args__ = (
        ForeignKeyConstraint(['team_id'], ['public.teams.id'], name='fk_team'),
        PrimaryKeyConstraint('id', name='nba_players_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    league: Mapped[str] = mapped_column(Enum('nba', 'nfl', 'mlb', name='league_type'))
    name: Mapped[Optional[str]] = mapped_column(Text)
    team_id: Mapped[Optional[int]] = mapped_column(Integer)
    position: Mapped[Optional[str]] = mapped_column(Text)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    height: Mapped[Optional[str]] = mapped_column(Text)
    weight: Mapped[Optional[str]] = mapped_column(Text)
    number: Mapped[Optional[str]] = mapped_column(Text)

    team: Mapped[Optional['Teams']] = relationship('Teams', back_populates='players')
    mlb_player_stats: Mapped[List['MlbPlayerStats']] = relationship('MlbPlayerStats', back_populates='player')
    nba_player_stats: Mapped[List['NbaPlayerStats']] = relationship('NbaPlayerStats', back_populates='player')
    props: Mapped[List['Props']] = relationship('Props', back_populates='player')


class MlbPlayerStats(Base):
    __tablename__ = 'mlb_player_stats'
    __table_args__ = (
        ForeignKeyConstraint(['game_id'], ['public.mlb_games.id'], name='fk_game'),
        ForeignKeyConstraint(['player_id'], ['public.players.id'], name='fk_player'),
        PrimaryKeyConstraint('id', name='mlb_player_stats_pkey'),
        UniqueConstraint('player_id', 'game_id', name='mlb_player_stats_player_game_unique'),
        {'schema': 'public'}
    )

    game_id: Mapped[str] = mapped_column(Text)
    id: Mapped[int] = mapped_column(Integer, Sequence('mlb_player_stats_new_id_seq', schema='public'), primary_key=True)
    at_bats: Mapped[Optional[int]] = mapped_column(Integer)
    runs: Mapped[Optional[int]] = mapped_column(Integer)
    hits: Mapped[Optional[int]] = mapped_column(Integer)
    doubles: Mapped[Optional[int]] = mapped_column(Integer)
    triples: Mapped[Optional[int]] = mapped_column(Integer)
    home_runs: Mapped[Optional[int]] = mapped_column(Integer)
    rbi: Mapped[Optional[int]] = mapped_column(Integer)
    stolen_bases: Mapped[Optional[int]] = mapped_column(Integer)
    caught_stealing: Mapped[Optional[int]] = mapped_column(Integer)
    walks: Mapped[Optional[int]] = mapped_column(Integer)
    strikeouts: Mapped[Optional[int]] = mapped_column(Integer)
    left_on_base: Mapped[Optional[int]] = mapped_column(Integer)
    hit_by_pitch: Mapped[Optional[int]] = mapped_column(Integer)
    sac_flies: Mapped[Optional[int]] = mapped_column(Integer)
    sac_bunts: Mapped[Optional[int]] = mapped_column(Integer)
    batting_avg: Mapped[Optional[float]] = mapped_column(Double(53))
    on_base_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    slugging_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    ops: Mapped[Optional[float]] = mapped_column(Double(53))
    innings_pitched: Mapped[Optional[float]] = mapped_column(Double(53))
    pitching_hits: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_runs: Mapped[Optional[int]] = mapped_column(Integer)
    earned_runs: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_walks: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_strikeouts: Mapped[Optional[int]] = mapped_column(Integer)
    pitching_home_runs: Mapped[Optional[int]] = mapped_column(Integer)
    pitches_thrown: Mapped[Optional[int]] = mapped_column(Integer)
    strikes: Mapped[Optional[int]] = mapped_column(Integer)
    balls: Mapped[Optional[int]] = mapped_column(Integer)
    season: Mapped[Optional[str]] = mapped_column(Text)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    player_id: Mapped[Optional[int]] = mapped_column(Integer)

    game: Mapped['MlbGames'] = relationship('MlbGames', back_populates='mlb_player_stats')
    player: Mapped[Optional['Players']] = relationship('Players', back_populates='mlb_player_stats')


class NbaPlayerStats(Base):
    __tablename__ = 'nba_player_stats'
    __table_args__ = (
        ForeignKeyConstraint(['game_id'], ['public.nba_games.id'], name='fk_game'),
        ForeignKeyConstraint(['player_id'], ['public.players.id'], name='fk_player'),
        PrimaryKeyConstraint('id', name='nba_player_stats_pkey'),
        UniqueConstraint('player_id', 'game_id', name='nba_player_stats_player_game_unique'),
        {'schema': 'public'}
    )

    id: Mapped[int] = mapped_column(Integer, Sequence('nba_player_stats_new_id_seq', schema='public'), primary_key=True)
    game_id: Mapped[Optional[str]] = mapped_column(Text)
    pts: Mapped[Optional[int]] = mapped_column(Integer)
    min: Mapped[Optional[int]] = mapped_column(Integer)
    fgm: Mapped[Optional[int]] = mapped_column(Integer)
    fga: Mapped[Optional[int]] = mapped_column(Integer)
    fta: Mapped[Optional[int]] = mapped_column(Integer)
    ftm: Mapped[Optional[int]] = mapped_column(Integer)
    three_pa: Mapped[Optional[int]] = mapped_column(Integer)
    three_pm: Mapped[Optional[int]] = mapped_column(Integer)
    oreb: Mapped[Optional[int]] = mapped_column(Integer)
    dreb: Mapped[Optional[int]] = mapped_column(Integer)
    reb: Mapped[Optional[int]] = mapped_column(Integer)
    ast: Mapped[Optional[int]] = mapped_column(Integer)
    stl: Mapped[Optional[int]] = mapped_column(Integer)
    blk: Mapped[Optional[int]] = mapped_column(Integer)
    tov: Mapped[Optional[int]] = mapped_column(Integer)
    pf: Mapped[Optional[int]] = mapped_column(Integer)
    plus_minus: Mapped[Optional[int]] = mapped_column(Integer)
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    season: Mapped[Optional[str]] = mapped_column(Text)
    true_shooting: Mapped[Optional[float]] = mapped_column(Double(53))
    usage_rate: Mapped[Optional[float]] = mapped_column(Double(53))
    reb_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    dreb_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    oreb_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    ast_pct: Mapped[Optional[float]] = mapped_column(Double(53))
    ast_ratio: Mapped[Optional[float]] = mapped_column(Double(53))
    tov_ratio: Mapped[Optional[float]] = mapped_column(Double(53))
    player_id: Mapped[Optional[int]] = mapped_column(Integer)

    game: Mapped[Optional['NbaGames']] = relationship('NbaGames', back_populates='nba_player_stats')
    player: Mapped[Optional['Players']] = relationship('Players', back_populates='nba_player_stats')


class Parlays(Base):
    __tablename__ = 'parlays'
    __table_args__ = (
        ForeignKeyConstraint(['match_user_id'], ['public.match_users.id'], name='fk_match_user'),
        PrimaryKeyConstraint('id', name='parlays_pkey'),
        {'schema': 'public'}
    )

    stake: Mapped[float] = mapped_column(Double(53))
    id: Mapped[int] = mapped_column(Integer, Sequence('parlays_new_id_seq', schema='public'), primary_key=True)
    type: Mapped[str] = mapped_column(Enum('perfect', 'flex', name='parlay_type'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    match_user_id: Mapped[Optional[int]] = mapped_column(Integer)
    resolved: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    delta: Mapped[Optional[float]] = mapped_column(Double(53), server_default=text('0'))

    match_user: Mapped[Optional['MatchUsers']] = relationship('MatchUsers', back_populates='parlays')
    parlay_picks: Mapped[List['ParlayPicks']] = relationship('ParlayPicks', back_populates='parlay')


class Props(Base):
    __tablename__ = 'props'
    __table_args__ = (
        ForeignKeyConstraint(['player_id'], ['public.players.id'], name='fk_player'),
        PrimaryKeyConstraint('id', name='props_pkey'),
        {'schema': 'public'}
    )

    line: Mapped[float] = mapped_column(Double(53))
    current_value: Mapped[float] = mapped_column(Double(53), server_default=text('0'))
    raw_game_id: Mapped[str] = mapped_column(Text)
    stat: Mapped[str] = mapped_column(Text)
    league: Mapped[str] = mapped_column(Enum('nba', 'nfl', 'mlb', name='league_type'))
    resolved: Mapped[bool] = mapped_column(Boolean, server_default=text('false'))
    id: Mapped[int] = mapped_column(Integer, Sequence('props_new_id_seq', schema='public'), primary_key=True)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    game_start_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    pick_options: Mapped[Optional[list]] = mapped_column(ARRAY(Text()), server_default=text("ARRAY['over'::text, 'under'::text]"))
    player_id: Mapped[Optional[int]] = mapped_column(Integer)

    player: Mapped[Optional['Players']] = relationship('Players', back_populates='props')
    parlay_picks: Mapped[List['ParlayPicks']] = relationship('ParlayPicks', back_populates='prop')


class ParlayPicks(Base):
    __tablename__ = 'parlay_picks'
    __table_args__ = (
        ForeignKeyConstraint(['parlay_id'], ['public.parlays.id'], name='fk_parlay'),
        ForeignKeyConstraint(['prop_id'], ['public.props.id'], name='fk_prop'),
        PrimaryKeyConstraint('id', name='parlay_picks_pkey'),
        {'schema': 'public'}
    )

    pick: Mapped[str] = mapped_column(Enum('over', 'under', name='pick_type'))
    status: Mapped[str] = mapped_column(Enum('hit', 'missed', 'not_resolved', name='pick_status'), server_default=text("'not_resolved'::pick_status"))
    id: Mapped[int] = mapped_column(Integer, Sequence('parlay_picks_new_id_seq', schema='public'), primary_key=True)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True), server_default=text('CURRENT_TIMESTAMP'))
    parlay_id: Mapped[Optional[int]] = mapped_column(Integer)
    prop_id: Mapped[Optional[int]] = mapped_column(Integer)

    parlay: Mapped[Optional['Parlays']] = relationship('Parlays', back_populates='parlay_picks')
    prop: Mapped[Optional['Props']] = relationship('Props', back_populates='parlay_picks')
