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

limit = 30 # number of games to analyze
points_threshold = 7 # minimum points to be considered for points prop generation
asists_threshold = 3 # minimum assists to be considered for assists prop generation
rebounds_threshold = 4 # minimum rebounds to be considered for rebounds prop generation
minutes_threshold = 15 # minimum minutes played to be considered for prop generation

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
          .limit(limit)
        ).subquery()
        stmt = (
          select(
            nba_player_stats.c.player_id,
            func.avg(nba_player_stats.c.min).label('avg_min'),
          )
          .where(nba_player_stats.c.player_id.in_(player_ids))
          .where(nba_player_stats.c.game_id.in_(subquery))
          .group_by(nba_player_stats.c.player_id)
          .having(func.avg(nba_player_stats.c.min) >= minutes_threshold)
        ) 
        
        result = conn.execute(stmt).fetchall()
        return [row['player_id'] for row in result]
    except Exception as e:
        print(f"Error fetching eligible players: {e}")
        return []
          
def determine_prop_generation(player_id):
  try:
    with engine.connect() as conn:
      results = {}
      
      stmt = (
        select(nba_player_stats)
        .where(nba_player_stats.c.player_id == player_id)
        .order_by(desc(nba_player_stats.c.updated_at))
        .limit(limit)
      )
      player_stats = conn.execute(stmt).fetchall()
      results[player_id] = [dict(row._mapping) for row in player_stats]
      
      for player_id, games in results.items():
        points = [game['pts'] for game in games if game['pts'] is not None]
        assists = [game['ast'] for game in games if game['ast'] is not None]
        rebounds = [game['reb'] for game in games if game['reb'] is not None]
        
        points_avg = sum(points) / len(points) if points else 0
        assists_avg = sum(assists) / len(assists) if assists else 0
        rebounds_avg = sum(rebounds) / len(rebounds) if rebounds else 0
        
        if points_avg >= points_threshold:
          print(f"Player {player_id} is eligible for points prop with average {points_avg:.2f}")
          # TODO
        
        if assists_avg >= asists_threshold:
          print(f"Player {player_id} is eligible for assists prop with average {assists_avg:.2f}")
          # TODO
        
        if rebounds_avg >= rebounds_threshold:
          print(f"Player {player_id} is eligible for rebounds prop with average {rebounds_avg:.2f}")
          # TODO
  
  except Exception as e:
      print(f"Error determining prop generation for player {player_id}: {e}")
      return None
          
    