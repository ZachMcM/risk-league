import os
import time
import pandas as pd
from nba_api.stats.endpoints import scoreboardv2, leaguegamefinder, leaguedashplayerstats
from dotenv import load_dotenv
from sqlalchemy import create_engine, insert, select, or_, join
from tables import nba_player_stats, nba_games, nba_players
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert as pg_insert
from utils import clean_minutes, get_game_type, get_current_season, get_last_season, db_response_to_json
import statistics
import random

# TODO NEED to keep track of game_id with the player_id so we can get stats from the opposing team

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

minutes_threshold = 10 # how many minutes a player must average in last n_games games to be considered for a prop
n_games = 30 # number of games to analyze
games_played = 10 # player must be in last 5 of teams 30

# gets all the games for today
def get_today_games():
  today = datetime.now().strftime("%Y-%m-%d")
  try:
    scoreboard = scoreboardv2.ScoreboardV2(game_date=today)
    games_df = scoreboard.get_data_frames()[0]
    return games_df
  except Exception as e:
    print(f"Error fetching today's games: {e}")
    return pd.DataFrame()
  
# for testing
def get_test_games():
  games = leaguegamefinder.LeagueGameFinder(
    season_nullable="2024-25",
    league_id_nullable='00',
    date_from_nullable="05/21/2025",
    date_to_nullable="05/21/2025"
  ).get_data_frames()[0]
  return games
  
def get_players_from_team(team_id):
  try:
    with engine.connect() as conn:
      stmt = select(nba_players).where(
          nba_players.c.team_id == str(team_id),
      )
      result = conn.execute(stmt).fetchall()
      return db_response_to_json(result, "id")
  except Exception as e:
      print(f"Error fetching roster for team {team_id}: {e}")
      return []
    
# gets the last n_games games for a team
def get_team_last_games(team_id, column_string = None, regular_season_only = True):
  try:
    with engine.connect() as conn:
      column = nba_games if column_string is None else getattr(nba_games.c, column_string)
      
      conditions = [nba_games.c.game_type == "regular_season"]
      
      if not regular_season_only:
        conditions.append(nba_games.c.game_type == "playoffs")
      
      stmt = (select(column)
              .where(nba_games.c.team_id == team_id)
              .where(or_(*conditions))
              .order_by(nba_games.c.game_date)
              .limit(n_games))
      
      result = conn.execute(stmt).fetchall()
      last_games = db_response_to_json(result, column_string)
      return last_games
  except Exception as e:
    return []

# returns a players last n_games games if they average more than minutes_threshold minutes and played >= games_played of teams last n_games
def get_player_last_games(player_id, team_last_games, regular_season_only = True):
  try:
    with engine.connect() as conn:
      j = nba_player_stats.join(
            nba_games,
            nba_player_stats.c.game_id == nba_games.c.id
          )
      
      conditions = [nba_games.c.game_type == "regular_season"]
      
      if not regular_season_only:
        conditions.append(nba_games.c.game_type == "playoffs")

      stmt = (select(nba_player_stats)
              .select_from(j)
              .where(or_(*conditions))
              .where(nba_player_stats.c.player_id == str(player_id))
              .order_by(nba_player_stats.c.updated_at)
              .limit(n_games))
            
      result = conn.execute(stmt).fetchall()
      last_games = db_response_to_json(result)
      
      curr_games_played = sum(1 for game in last_games if game["id"] in team_last_games)
      
      if len(last_games) == 0 or curr_games_played >= games_played or sum(game["min"] for game in last_games) / len(last_games) < minutes_threshold:
        return None
      else:
        return last_games 
      
  except Exception as e:
      print(f"Error fetching eligible players: {e}")
      return None
       
# gets the league mean and standard deviation of a specific stat 
def get_metric_stats(metric):
  season = get_current_season()
  with engine.connect() as conn:
    try:
      if datetime.datetime.now().month < 11:
        season = get_last_season()
      
      column = getattr(nba_player_stats.c, metric)
      
      stmt = (
        select(column)
        .where(nba_player_stats.c.season == season)
        .where(nba_player_stats.c.game_type == "regular_season")
      )
      
      result = conn.execute(stmt).fetchall()
      stats = db_response_to_json(result, metric)
      return {
        "mean": statistics.mean(stats),
        "sd": statistics.stdev(stats)
      }
    except Exception as e:
      print(f"⚠️ Error getting stats for metric {metric} for the {get_current_season()} season")
      return None

# TODO
# gets the league mean and standard deviation of combined metrics
def get_combined_metric_stats():
  None 

# we are gonna have a data structure with player and basic game data for future lookups
games = get_test_games().to_dict('records')
player_data_list = []

for game in games:
  team_id = game["TEAM_ID"]
  players_from_team = get_players_from_team(team_id)
  for player_id in players_from_team:
    team_last_games = get_team_last_games(team_id, "id")
    
    player_last_games = get_player_last_games(player_id, team_last_games)
    if player_last_games == None:
      continue
    player_data_list.append({
      "matchup": game["MATCHUP"][5:],
      "player_id": player_id,
      "game_id": game["GAME_ID"],
      "last_games": player_last_games
    })  

print(player_data_list[random.randint(0, len(player_data_list) - 1)])