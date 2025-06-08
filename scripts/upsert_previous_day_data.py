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
from sqlalchemy.exc import IntegrityError
from tables import nba_player_stats, nba_games
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import insert as pg_insert
from utils import clean_minutes, get_game_type, get_current_season
import sys

# This script updates the database with all the NBA games from the past day

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def get_previous_day_games():
    season = get_current_season()
    yesterday = datetime.now() - timedelta(days=2)
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
        return pd.DataFrame()  # Return empty if no data

    return pd.concat(dfs, ignore_index=True)


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
            print(f"✅ Inserted {len(data)} games")
        except IntegrityError as e:
            print(f"⚠️ Insert failed due to integrity error: {e._message}")
            sys.exit(1)


def get_boxscore(game_id):
    try:
        boxscore = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id)
        return boxscore.get_data_frames()[0]
    except Exception as e:
        print(f"Error fetching boxscore for game {game_id}: {e}")
        return None


def get_boxscore_advanced(game_id):
    try:
        boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)
        return boxscore.get_data_frames()[0]
    except Exception as e:
        print(f"⚠️ Error fetching boxscore advanced for game {game_id}: {e}")
        sys.exit(1)


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
                    "true_shooting",
                    "usage_rate",
                    "reb_pct",
                    "dreb_pct",
                    "oreb_pct",
                    "ast_pct",
                    "ast_ratio",
                    "tov_ratio",
                ]
            }
            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            conn.execute(stmt)
            print(f"✅ Upserted {len(data)} player stats")
        except IntegrityError as e:
            print(f"⚠️ Upsert failed: {e._message}")
            sys.exit(1)


def insert_advanced_stats(
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


games = get_previous_day_games()

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

i = 0
for _, row in games.iterrows():
    print(f"Processing advanced stats for game {row['id']} {i + 1}/{len(games)}")
    game_id = row["id"][: row["id"].find("-")]
    team_id = row["team_id"]

    advanced_df = get_boxscore_advanced(game_id)
    time.sleep(3)
    team_row = advanced_df[advanced_df["teamId"] == team_id].iloc[0]

    insert_advanced_stats(
        float(team_row["pace"]),
        float(team_row["turnoverRatio"]),
        float(team_row["estimatedTeamTurnoverPercentage"]),
        float(team_row["offensiveRating"]),
        float(team_row["defensiveRating"]),
        row["id"],
    )
    i = i + 1

game_ids = games["id"].unique().tolist()
active_players = get_active_players()
player_ids = set(player["id"] for player in active_players)

for i, game_id in enumerate(game_ids):
    print(f"Processing game {i + 1}/{len(game_ids)}: {game_id}")
    df = get_boxscore(game_id)
    time.sleep(3)  # ~20 requests per minute
    advanced_df = get_boxscore_advanced(game_id)
    if df is None or advanced_df is None or df.empty or advanced_df.empty:
        break  # Means connection timed out so we stop processing
    time.sleep(3)  # ~20 requests per minute

    df["minutes"] = df["minutes"].apply(clean_minutes)
    df["game_id"] = game_id + "-" + df["teamId"].astype(str)
    df["id"] = df["game_id"] + "-" + df["personId"].astype(str)
    df["season"] = get_current_season()

    # add in advanced stats
    df["true_shooting"] = advanced_df["trueShootingPercentage"]
    df["usage_rate"] = advanced_df["usagePercentage"]
    df["reb_pct"] = advanced_df["reboundPercentage"]
    df["dreb_pct"] = advanced_df["defensiveReboundPercentage"]
    df["oreb_pct"] = advanced_df["offensiveReboundPercentage"]
    df["ast_pct"] = advanced_df["assistPercentage"]
    df["ast_ratio"] = advanced_df["assistRatio"]
    df["tov_ratio"] = advanced_df["turnoverRatio"]

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
            "true_shooting",
            "usage_rate",
            "reb_pct",
            "dreb_pct",
            "oreb_pct",
            "ast_pct",
            "ast_ratio",
            "tov_ratio",
        ]
    ]

    stat_df["player_id"] = stat_df["player_id"].apply(
        lambda x: x if x in player_ids else None
    )
    stat_df["player_id"] = stat_df["player_id"].astype("Int64")

    insert_player_stats(stat_df, engine, nba_player_stats)

engine.dispose()  # Close the database connection
