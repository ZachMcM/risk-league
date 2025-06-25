import os
import sys
import time

import pandas as pd
from dotenv import load_dotenv
from nba_api.stats.endpoints import boxscoreadvancedv3, leaguegamefinder
from nba.constants import req_pause_time
from nba.tables import nba_games
from sqlalchemy import create_engine, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from nba.utils import get_current_season, get_game_type

# This script initializes the database with NBA game data from multiple seasons. This script should only be run once to populate the database with historical data.

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def get_games():
    season = get_current_season()
    # Regular Season
    regular = leaguegamefinder.LeagueGameFinder(
        season_nullable=season,
        season_type_nullable="Regular Season",
        league_id_nullable="00",
    ).get_data_frames()[0]

    # Playoffs
    playoffs = leaguegamefinder.LeagueGameFinder(
        season_nullable=season, season_type_nullable="Playoffs", league_id_nullable="00"
    ).get_data_frames()[0]

    # Combine both
    dfs = [df for df in [regular, playoffs] if not df.empty]

    if not dfs:
        return pd.DataFrame()  # Return empty if no data

    return pd.concat(dfs, ignore_index=True)


def get_boxscore_advanced(game_id):
    try:
        boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)
        return boxscore.get_data_frames()[1]
    except Exception as e:
        print(f"⚠️ Error fetching boxscore advanced for game {game_id}: {e}")
        sys.exit(1)


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


def process_advanced_stats(games, start_index=0):
    for i, (_, row) in enumerate(
        games.iloc[start_index:].iterrows(), start=start_index
    ):
        print(f"Processing advanced stats for game {row['id']} {i + 1}/{len(games)}")
        game_id = row["id"][: row["id"].find("-")]
        team_id = row["team_id"]

        advanced_df = get_boxscore_advanced(game_id)
        time.sleep(req_pause_time)
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


def process_original_games(games):
    games["id"] = games["GAME_ID"].astype(str) + "-" + games["TEAM_ID"].astype(str)
    games["game_type"] = games["GAME_ID"].astype(str).str[:3].apply(get_game_type)
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
    ]

    games["game_date"] = pd.to_datetime(games["game_date"], errors="coerce")

    insert_games(games, engine, nba_games)


def main():
    games = get_games()

    if len(sys.argv) == 3:
        if sys.argv[1] == "advanced":
            process_advanced_stats(games, int(sys.argv[2]))
    elif len(sys.argv) == 2:
        if sys.argv[1] == "advanced":
            process_advanced_stats(games)
        else:
            process_original_games(games)
    else:
        process_original_games(games)
        time.sleep(10)
        process_advanced_stats(games)

    engine.dispose()


if __name__ == "__main__":
    main()
