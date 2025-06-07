from sqlalchemy import Table, Column, MetaData, Integer, String, TIMESTAMP, ForeignKey, Numeric, text

metadata = MetaData()

nba_teams = Table(
  "nba_teams",
  metadata,
  Column("id", String, primary_key=True),
  Column("full_name", String),
  Column("abbreviation", String),
  Column("nickname", String),
  Column("city", String),
  Column("state", String),
  Column("year_founded", Integer),
)

nba_players = Table(
  "nba_players",
  metadata,
  Column("id", String, primary_key=True),
  Column("name", String),
  Column("team_id", String, ForeignKey("nba_teams.id")),
  Column("position", String),
  Column("height", String),
  Column("weight", String),
  Column("number", Integer),
  Column("updated_at", TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP")),
)

nba_games = Table(
  "nba_games",
  metadata,
  Column("id", String, primary_key=True, server_default=text("gen_random_uuid()")),
  Column("game_id", String, unique=True),
  Column("team_id", String, ForeignKey("nba_teams.id")),
  Column("pts", Integer),
  Column("game_date", TIMESTAMP(timezone=True)),
  Column("wl", String),
  Column("matchup", String),
  Column("min", Integer),
  Column("fgm", Integer),
  Column("fga", Integer),
  Column("fta", Integer),
  Column("ftm", Integer),
  Column("three_pa", Integer),
  Column("three_pm", Integer),
  Column("oreb", Integer),
  Column("dreb", Integer),
  Column("reb", Integer),
  Column("ast", Integer),
  Column("stl", Integer),
  Column("blk", Integer),
  Column("tov", Integer),
  Column("pf", Integer),
  Column("plus_minus", Integer),
  Column("game_type", String),
  Column("season", String)
)

nba_player_stats = Table(
  "nba_player_stats",
  metadata,
  Column("id", String, primary_key=True, server_default=text("gen_random_uuid()")),
  Column("player_id", String, ForeignKey("nba_players.id")),
  Column("game_id", String, ForeignKey("nba_games.id")),
  Column("pts", Integer),
  Column("min", Integer),
  Column("fgm", Integer),
  Column("fga", Integer),
  Column("fta", Integer),
  Column("ftm", Integer),
  Column("three_pa", Integer),
  Column("three_pm", Integer),
  Column("oreb", Integer),
  Column("dreb", Integer),
  Column("reb", Integer),
  Column("ast", Integer),
  Column("stl", Integer),
  Column("blk", Integer),
  Column("tov", Integer),
  Column("pf", Integer),
  Column("plus_minus", Integer),
  Column("updated_at", TIMESTAMP(timezone=True), server_default=text("CURRENT_TIMESTAMP")),
  Column("season", String)
)

nba_props = Table(
  "nba_props",
  metadata,
  Column("id", String, primary_key=True, server_default=text("gen_random_uuid()")),
  Column("stat_type", String),
  Column("player_id", String, ForeignKey("nba_players.id")),
  Column("game_id", String, ForeignKey("nba_games.id")),
  Column("line", Numeric),
  Column("current_value", Numeric),
  Column("created_date", TIMESTAMP, default=("CURRENT_TIMESTAMP"))
)