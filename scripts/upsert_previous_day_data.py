import os
import time
import pandas as pd
from nba_api.stats.endpoints import (
    leaguegamefinder,
    boxscoretraditionalv3,
    boxscoreadvancedv3,
)
from nba_api.stats.static.players import get_active_players
from dotenv import load_dotenv
from sqlalchemy import create_engine, update
from tables import nba_player_stats, nba_games
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import insert as pg_insert
from utils import clean_minutes, get_game_type, get_current_season
import sys
from constants import req_pause_time

# This script updates the database with all the NBA games from the past day

step_sleep_time = 3
load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

# gets all the games from the previous day
def get_previous_day_games():
    season = get_current_season()
    yesterday = datetime.now() - timedelta(days=1)
    yesterday_str = yesterday.strftime("%m/%d/%Y")  # Format: MM/DD/YYYY
    regular = leaguegamefinder.LeagueGameFinder(
        season_nullable=season,
        season_type_nullable="Regular Season",
        league_id_nullable="00",
        date_from_nullable=yesterday_str,
        date_to_nullable=yesterday_str,
    ).get_data_frames()[0]
    playoffs = leaguegamefinder.LeagueGameFinder(
        season_nullable=season,
        season_type_nullable="Playoffs",
        league_id_nullable="00",
        date_from_nullable=yesterday_str,
        date_to_nullable=yesterday_str,
    ).get_data_frames()[0]
    dfs = [df for df in [regular, playoffs] if not df.empty]

    if not dfs:
        print("No games played yesterday!")
        sys.exit(0)  # Return empty if no data

    return pd.concat(dfs, ignore_index=True)

# inserts games into the db
def insert_games(games_df, engine, nba_games):
    data = games_df.to_dict(orient="records")

    if not data:
        print("No data to insert.")
        return

    with engine.begin() as conn:
        try:
            stmt = pg_insert(nba_games).values(data)
            update_cols = {
                col: stmt.excluded[col]
                for col in [
                    "id",
                    "team_id",
                    "game_type",
                    "pts",
                    "game_date",
                    "wl",
                    "matchup",
                    "min",
                    "fgm",
                    "fga",
                    "fta",
                    "ftm",
                    "three_pa",
                    "three_pm",
                    "oreb",
                    "dreb",
                    "reb",
                    "ast",
                    "stl",
                    "blk",
                    "tov",
                    "pf",
                    "plus_minus",
                    "season",
                ]
            }
            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            conn.execute(stmt)
            print(f"✅ Inserted {len(data)} games\n")
        except Exception as e:
            print(f"⚠️ Insert failed due to error: {e}")
            sys.exit(1)


def get_boxscore(game_id):
    try:
        boxscore = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id)
        return boxscore.get_data_frames()[0]
    except Exception as e:
        print(f"⚠️ Error fetching boxscore for game {game_id}: {e}")
        sys.exit(1)

def get_boxscore_advanced(game_id):
    try:
        boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)
        return boxscore.get_data_frames()[0]
    except Exception as e:
        print(f"⚠️ Error fetching boxscore advanced for game {game_id}: {e}")
        sys.exit(1)
        
def get_team_advanced(game_id):
    try:
        boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)
        return boxscore.get_data_frames()[1]
    except Exception as e:
        print(f"⚠️ Error fetching boxscore advanced for game {game_id}: {e}")
        sys.exit(1)

# inserts player advanced stats into the db
def insert_player_advanced_stats(
    id: str,
    true_shooting: float,
    usage_rate: float,
    reb_pct: float,
    dreb_pct: float,
    oreb_pct: float,
    ast_pct: float,
    ast_ratio: float,
    tov_ratio: float,
):
    try:
        with engine.begin() as conn:
            stmt = (
                update(nba_player_stats)
                .where(nba_player_stats.c.id == id)
                .values(
                    true_shooting=true_shooting,
                    usage_rate=usage_rate,
                    reb_pct=reb_pct,
                    dreb_pct=dreb_pct,
                    oreb_pct=oreb_pct,
                    ast_pct=ast_pct,
                    ast_ratio=ast_ratio,
                    tov_ratio=tov_ratio,
                )
            )

            conn.execute(stmt)
            print(f"✅ Inserted game {id} advanced stats\n")
    except Exception as e:
        print(f"⚠️ There was an error inserting advanced stats for game {id}, {e}")
        sys.exit(1)


# inserts the basic player stats into the db
def insert_player_stats(stats_df, engine, nba_player_stats):
    data = stats_df.to_dict(orient="records")
    if not data:
        print("⚠️ No data to insert.")
        sys.exit(1)

    with engine.begin() as conn:
        try:
            stmt = pg_insert(nba_player_stats).values(data)
            update_cols = {
                col: stmt.excluded[col]
                for col in [
                    "player_id",
                    "game_id",
                    "pts",
                    "min",
                    "fgm",
                    "fga",
                    "fta",
                    "ftm",
                    "three_pa",
                    "three_pm",
                    "oreb",
                    "dreb",
                    "reb",
                    "ast",
                    "stl",
                    "blk",
                    "tov",
                    "pf",
                    "plus_minus",
                    "id",
                    "season",
                ]
            }
            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            conn.execute(stmt)
            print(f"✅ Upserted {len(data)} player stats\n")
        except Exception as e:
            print(f"⚠️ Upsert failed: {e}")
            sys.exit(1)

# inserts team advanced stats into the db
def insert_team_advanced_stats(
    pace: float,
    tov_ratio: float,
    tov_pct: float,
    off_rating: float,
    def_rating: float,
    game_id: str,
):
    try:
        with engine.begin() as conn:
            stmt = (
                update(nba_games)
                .where(nba_games.c.id == game_id)
                .values(
                    pace=pace,
                    tov_ratio=tov_ratio,
                    tov_pct=tov_pct,
                    off_rating=off_rating,
                    def_rating=def_rating,
                )
            )

            conn.execute(stmt)
            print(f"✅ Inserted game {game_id} advanced stats\n")
    except Exception as e:
        print(f"⚠️ There was an error inserting, {e}")
        sys.exit(1)


def main():
  games = get_previous_day_games()
  
  game_ids = games["GAME_ID"].unique().tolist()

  # inserts regular team game stats
  games["game_type"] = games["GAME_ID"].astype(str).str[:3].apply(get_game_type)
  games["id"] = games["GAME_ID"].astype(str) + "-" + games["TEAM_ID"].astype(str)
  games["season"] = get_current_season()

  games = games.rename(
      columns={
          "TEAM_ID": "team_id",
          "PTS": "pts",
          "GAME_DATE": "game_date",
          "WL": "wl",
          "MATCHUP": "matchup",
          "MIN": "min",
          "FGM": "fgm",
          "FGA": "fga",
          "FTA": "fta",
          "FTM": "ftm",
          "FG3A": "three_pa",
          "FG3M": "three_pm",
          "OREB": "oreb",
          "DREB": "dreb",
          "REB": "reb",
          "AST": "ast",
          "STL": "stl",
          "BLK": "blk",
          "TOV": "tov",
          "PF": "pf",
          "PLUS_MINUS": "plus_minus",
      }
  )[
      [
          "id",
          "team_id",
          "pts",
          "game_date",
          "wl",
          "matchup",
          "min",
          "fgm",
          "fga",
          "fta",
          "ftm",
          "three_pa",
          "three_pm",
          "oreb",
          "dreb",
          "reb",
          "ast",
          "stl",
          "blk",
          "tov",
          "pf",
          "plus_minus",
          "game_type",
          "season",
      ]
  ]

  games["min"] = games["min"]
  games["game_date"] = pd.to_datetime(games["game_date"], errors="coerce")
  insert_games(games, engine, nba_games)
  
  time.sleep(step_sleep_time)

  # inserts team advanced stats per game
  i = 0
  for _, row in games.iterrows():
      print(f"Processing advanced stats for game {row['id']} {i + 1}/{len(games)}")
      game_id = row["id"][: row["id"].find("-")]
      team_id = row["team_id"]

      advanced_df = get_team_advanced(game_id)
      time.sleep(req_pause_time)
      team_row = advanced_df[advanced_df["teamId"] == team_id].iloc[0]

      insert_team_advanced_stats(
          float(team_row["pace"]),
          float(team_row["turnoverRatio"]),
          float(team_row["estimatedTeamTurnoverPercentage"]),
          float(team_row["offensiveRating"]),
          float(team_row["defensiveRating"]),
          row["id"],
      )
      i = i + 1
      
  time.sleep(step_sleep_time)

  # Inserts the player stats without advanced stats first

  active_players = get_active_players()
  player_ids = set(player["id"] for player in active_players)

  for i, game_id in enumerate(game_ids):
      print(f"Processing game {i + 1}/{len(game_ids)}: {game_id}")
      df = get_boxscore(game_id)
      time.sleep(req_pause_time) 
      if df is None or df.empty:
          break  # Means connection timed out so we stop processing

      df["minutes"] = df["minutes"].apply(clean_minutes)
      df["game_id"] = game_id + "-" + df["teamId"].astype(str)
      df["id"] = df["game_id"] + "-" + df["personId"].astype(str)
      df["season"] = get_current_season()

      stat_df = df.rename(
          columns={
              "personId": "player_id",
              "minutes": "min",
              "points": "pts",
              "assists": "ast",
              "steals": "stl",
              "blocks": "blk",
              "turnovers": "tov",
              "fieldGoalsAttempted": "fga",
              "fieldGoalsMade": "fgm",
              "freeThrowsAttempted": "fta",
              "freeThrowsMade": "ftm",
              "threePointersAttempted": "three_pa",
              "threePointersMade": "three_pm",
              "plusMinusPoints": "plus_minus",
              "reboundsOffensive": "oreb",
              "reboundsDefensive": "dreb",
              "reboundsTotal": "reb",
              "foulsPersonal": "pf",
          }
      )[
          [
              "player_id",
              "game_id",
              "pts",
              "min",
              "fgm",
              "fga",
              "fta",
              "ftm",
              "three_pa",
              "three_pm",
              "oreb",
              "dreb",
              "reb",
              "ast",
              "stl",
              "blk",
              "tov",
              "pf",
              "plus_minus",
              "id",
              "season",
          ]
      ]

      stat_df["player_id"] = stat_df["player_id"].apply(
          lambda x: x if x in player_ids else None
      )
      stat_df["player_id"] = stat_df["player_id"].astype("Int64")

      insert_player_stats(stat_df, engine, nba_player_stats)
      
  time.sleep(step_sleep_time)

  # inserts the advanced stats after regular stats are inserted
  for i, game_id in enumerate(game_ids):
      print(f"Processing advanced stats game {i + 1}/{len(game_ids)}: {game_id}")
      advanced_df = get_boxscore_advanced(game_id)
      time.sleep(req_pause_time)

      for _, row in advanced_df.iterrows():

          id = game_id + "-" + str(row["teamId"]) + "-" + str(row["personId"])
          insert_player_advanced_stats(
              id,
              row["trueShootingPercentage"],
              row["usagePercentage"],
              row["reboundPercentage"],
              row["defensiveReboundPercentage"],
              row["offensiveReboundPercentage"],
              row["assistPercentage"],
              row["assistRatio"],
              row["turnoverRatio"],
          )

  engine.dispose()  # Close the database connection

if __name__ == "__main__":
    main()