import os
import time
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder, boxscoretraditionalv3
from nba_api.stats.static.players import get_active_players
from dotenv import load_dotenv
from sqlalchemy import create_engine, insert
from sqlalchemy.exc import IntegrityError
from tables import nba_player_stats, nba_games
from utils import clean_minutes, get_current_season
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import insert as pg_insert

# This script updates the database with all the NBA games from the past day

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

def get_previous_day_games():
  season = get_current_season()
  yesterday = datetime.now() - timedelta(days=1)
  yesterday_str = yesterday.strftime("%m/%d/%Y")  # Format: MM/DD/YYYY
  gamefinder = leaguegamefinder.LeagueGameFinder(
      season_nullable=season,
      league_id_nullable='00',
      date_from_nullable=yesterday_str,
      date_to_nullable=yesterday_str,
  )
  df = gamefinder.get_data_frames()[0]
  return df

def insert_games(games_df, engine, nba_games):
  data = games_df.to_dict(orient="records")
  
  if not data:
    print("No data to insert.")
    return
  
  with engine.begin() as conn:
    try:
      stmt = insert(nba_games).values(data)
      conn.execute(stmt)
      print(f"✅ Inserted {len(data)} games")
    except IntegrityError as e:
      print(f"⚠️ Insert failed due to integrity error: {e._message}")
      return
    
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

games = get_previous_day_games()
games['id'] = games['GAME_ID'].astype(str) + '-' + games['TEAM_ID'].astype(str)
games = games.rename(columns = {
  'TEAM_ID': 'team_id',
  'PTS': 'pts',
  'GAME_DATE': 'game_date',
  'WL': 'wl',
  'MATCHUP': 'matchup',
  'MIN': 'min',
  'FGM': 'fgm',
  'FGA': 'fga',
  'FTA': 'fta',
  'FTM': 'ftm',
  'FG3A': 'three_pa',
  'FG3M': 'three_pm',
  'OREB': 'oreb',
  'DREB': 'dreb',
  'REB': 'reb',
  'AST': 'ast',
  'STL': 'stl',
  'BLK': 'blk',
  'TOV': 'tov',
  'PF': 'pf',
  'PLUS_MINUS': 'plus_minus'
})[
  ['id', 'team_id', 'pts', 'game_date', 'wl', 'matchup', 'min', 'fgm', 'fga', 'fta', 'ftm', 
  'three_pa', 'three_pm', 'oreb', 'dreb', 'reb', 'ast', 
  'stl', 'blk', 'tov', 'pf', 'plus_minus']
]

games['min'] = games['min'].apply(clean_minutes)
games['game_date'] = pd.to_datetime(games['game_date'], errors='coerce')
insert_games(games, engine, nba_games)

game_ids = games['GAME_ID'].unique().tolist()
active_players = get_active_players()
player_ids = set(player['id'] for player in active_players)

for game_id in game_ids:
  print(f"Processing game: {game_id} for day {games['game_date'].iloc[0]}")
  df = get_boxscore(game_id)
  if df is None or df.empty:
    break # Means connection timed out so we stop processing
  time.sleep(3)  # ~20 requests per minute
  
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
    
engine.dispose()  # Close the database connection