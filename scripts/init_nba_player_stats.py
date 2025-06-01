import os
import time
from sqlalchemy import create_engine
from nba_api.stats.endpoints import leaguegamefinder, boxscoretraditionalv3
from nba_api.stats.static.players import get_active_players
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from tables import nba_player_stats
from utils import clean_minutes
from sqlalchemy.dialects.postgresql import insert as pg_insert

# Load environment variables and set up DB engine
load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

# Fetch game metadata for a given season
def get_game_ids(season):
  gamefinder = leaguegamefinder.LeagueGameFinder(
    season_nullable=season,
    season_type_nullable='Regular Season',
    league_id_nullable='00'
  )
  df = gamefinder.get_data_frames()[0]
  return df['GAME_ID'].unique().tolist()

# Fetch advanced box score data for a given game ID
def get_boxscore(game_id):
  try:
    boxscore = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id)
    return boxscore.get_data_frames()[0]
  except Exception as e:
    print(f"Error fetching boxscore for game {game_id}: {e}")
    return None

def insert_player_stats(stats_df, engine, nba_player_stats):
  data = stats_df.to_dict(orient="records")
  if not data:
    print("⚠️ No data to insert.")
    return

  with engine.begin() as conn:
    try:
      stmt = pg_insert(nba_player_stats).values(data)
      update_cols = {col: stmt.excluded[col] for col in [
        'player_id', 'game_id', 'pts', 'min', 'fgm', 'fga', 'fta', 'ftm',
        'three_pa', 'three_pm', 'oreb', 'dreb', 'reb', 'ast', 'stl', 'blk',
        'tov', 'pf', 'plus_minus'
      ]}
      stmt = stmt.on_conflict_do_update(
        index_elements=['id'],
        set_=update_cols
      )
      conn.execute(stmt)
      print(f"✅ Upserted {len(data)} player stats")
    except IntegrityError as e:
      print(f"⚠️ Upsert failed: {e._message}")

# Start
game_ids = get_game_ids("2024-25")
print(len(game_ids), "games found for 2024–25 season")

active_players = get_active_players()
player_ids = set(player['id'] for player in active_players)

start_index = 0
# Process each game with 3-second sleep (~20 requests/min)
for i, game_id in enumerate(game_ids[start_index:], start = start_index + 1):
  print(f"Processing game {i + 1}/{len(game_ids)}: {game_id}")
  df = get_boxscore(game_id)
  time.sleep(3)  # ~20 requests per minute

  if df is None or df.empty:
      continue

  df['minutes'] = df['minutes'].apply(clean_minutes)
  df['game_id'] = game_id + "-" + df['teamId'].astype(str)

  stat_df = df.rename(columns={
    'personId': 'player_id',
    'minutes': 'min',
    'points': 'pts',
    'assists': 'ast',
    'steals': 'stl',
    'blocks': 'blk',
    'turnovers': 'tov',
    'fieldGoalsAttempted': 'fga',
    'fieldGoalsMade': 'fgm',
    'freeThrowsAttempted': 'fta',
    'freeThrowsMade': 'ftm',
    'threePointersAttempted': 'three_pa',
    'threePointersMade': 'three_pm',
    'plusMinusPoints': 'plus_minus',
    'reboundsOffensive': 'oreb',
    'reboundsDefensive': 'dreb',
    'reboundsTotal': 'reb',
    'foulsPersonal': 'pf',
  })[
    ['player_id', 'game_id', 'pts', 'min', 'fgm', 'fga', 'fta', 'ftm',
      'three_pa', 'three_pm', 'oreb', 'dreb', 'reb', 'ast', 'stl', 'blk',
      'tov', 'pf', 'plus_minus']
  ]

  stat_df['player_id'] = stat_df['player_id'].apply(lambda x: x if x in player_ids else None)
  stat_df['player_id'] = stat_df['player_id'].astype('Int64')

  insert_player_stats(stat_df, engine, nba_player_stats)

engine.dispose()