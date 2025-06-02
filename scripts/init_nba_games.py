import os
import time
import pandas as pd
from nba_api.stats.endpoints import leaguegamefinder
from dotenv import load_dotenv
from sqlalchemy import create_engine, insert
from sqlalchemy.exc import IntegrityError
from tables import nba_games
from utils import clean_minutes

# This script initializes the database with NBA game data from multiple seasons. This script should only be run once to populate the database with historical data.

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

def get_games(season):
  gamefinder = leaguegamefinder.LeagueGameFinder(
      season_nullable=season,
      season_type_nullable='Regular Season',
      league_id_nullable='00' 
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

games = get_games("2024-25")

games['id'] = games['GAME_ID'].astype(str) + '-' + games['TEAM_ID'].astype(str)
  
games = games.rename(columns={
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
time.sleep(0.6)
  
engine.dispose()
    
    