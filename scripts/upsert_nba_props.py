import os
import time
import pandas as pd
from nba_api.stats.endpoints import scoreboardv2
from dotenv import load_dotenv
from sqlalchemy import create_engine, insert, select, desc, func
from tables import nba_player_stats, nba_games
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert as pg_insert

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

def get_today_games():
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        scoreboard = scoreboardv2.ScoreboardV2(game_date=today)
        games_df = scoreboard.get_data_frames()[0]
        return games_df
    except Exception as e:
        print(f"Error fetching today's games: {e}")
        return pd.DataFrame()
  
def get_players_from_team(team_id):
    try:
      with engine.connect() as conn:
          stmt = select(nba_player_stats).where(
              nba_player_stats.c.team_id == team_id,
          )
          result = conn.execute(stmt).fetchall()
      return [row['player_id'] for row in result]
    except Exception as e:
        print(f"Error fetching roster for team {team_id}: {e}")
        return []

def get_eligible_players(player_ids):
    try:
      with engine.connect() as conn:
        subquery = (
          select(nba_player_stats.c.game_id)
          .order_by(desc(nba_player_stats.c.updated_at))
          .limit(30)
        ).subquery()
        stmt = (
          select(
            nba_player_stats.c.player_id,
            func.avg(nba_player_stats.c.min).label('avg_min'),
          )
          .where(nba_player_stats.c.player_id.in_(player_ids))
          .where(nba_player_stats.c.game_id.in_(subquery))
          .group_by(nba_player_stats.c.player_id)
          .having(func.avg(nba_player_stats.c.min) >= 20)
        ) 
        
        result = conn.execute(stmt).fetchall()
        return [row['player_id'] for row in result]
    except Exception as e:
        print(f"Error fetching eligible players: {e}")
        return []
          
def upsert_props_per_player():
  # TODO
  pass          
          
    