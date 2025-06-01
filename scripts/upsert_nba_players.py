import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert as pg_insert
from nba_api.stats.static import teams 
from nba_api.stats.endpoints import commonteamroster
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from tables import nba_players
import time 
from utils import get_current_season

# Load environment variables
load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

# This script is to be ran periodically to update the players with the latest nba rosters.

def get_team_players(team_id, season):
  try:
    roster = commonteamroster.CommonTeamRoster(team_id=team_id)
    return roster.get_data_frames()[0]
  except Exception as e:
    print(f"Error fetching roster for team {team_id}: {e}")
    return pd.DataFrame()

def insert_team_players(data, engine, nba_players):
  records = data.to_dict(orient="records")

  with engine.begin() as conn:
    try:
      stmt = pg_insert(nba_players).values(records)
      
      update_cols = {col: stmt.excluded[col] for col in ["name", "team_id", "position", "height", "weight", "number"]}
      
      stmt = stmt.on_conflict_do_update(
        index_elements=["id"],  # primary key or unique constraint
        set_=update_cols
      )

      conn.execute(stmt)
      print(f"✅ Upserted {len(data)} players")
    except IntegrityError as e:
      print(f"⚠️ Upsert failed due to integrity error: {e._message}")

season = get_current_season()
team_list = teams.get_teams()

for team in team_list:
  team_id = team['id']
  players_df = get_team_players(team_id, season)
  
  data = players_df.rename(columns={
    "PLAYER_ID": "id",
    "PLAYER": "name",
    "TeamID": "team_id",
    "POSITION": "position",
    "HEIGHT": "height",
    "WEIGHT": "weight",
    "NUM": "number"
  })[
    ["id", "name", "team_id", "position", "height", "weight", "number"]
  ]
  
  insert_team_players(data, engine, nba_players)
  time.sleep(0.6)

engine.dispose()
