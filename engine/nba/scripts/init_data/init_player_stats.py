import os
import sys
import time

import pandas as pd
from dotenv import load_dotenv
from nba_api.stats.endpoints import (
    boxscoreadvancedv3,
    boxscoretraditionalv3,
    leaguegamefinder,
)
from nba_api.stats.static.players import get_active_players
from nba.constants import req_pause_time
from shared.tables import t_nba_player_stats
from sqlalchemy import create_engine, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from nba.utils import clean_minutes, get_current_season


# Fetch game metadata for a given season
def get_game_ids():
    season = get_current_season()
    regular = leaguegamefinder.LeagueGameFinder(
        season_nullable=season,
        season_type_nullable="Regular Season",
        league_id_nullable="00",
    ).get_data_frames()[0]
    playoffs = leaguegamefinder.LeagueGameFinder(
        season_nullable=season,
        season_type_nullable="Playoffs",
        league_id_nullable="00",
    ).get_data_frames()[0]

    df = pd.concat([regular, playoffs], ignore_index=True)

    return df["GAME_ID"].unique().tolist()


# Fetch advanced box score data for a given game ID
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


def insert_advanced_stats(
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
                update(t_nba_player_stats)
                .where(t_nba_player_stats.c.id == id)
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

            result = conn.execute(stmt)
            print(f"✅ Updated game {id} advanced stats")
    except Exception as e:
        print(f"⚠️ There was an error inserting advanced stats for game {id}, {e}")
        sys.exit(1)


def insert_player_stats(stats_df, engine):
    data = stats_df.to_dict(orient="records")
    if not data:
        print("⚠️ No data to insert.")
        return

    with engine.begin() as conn:
        try:
            stmt = pg_insert(t_nba_player_stats).values(data)
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
            print(f"✅ Upserted {len(data)} player stats")
        except Exception as e:
            print(f"⚠️ Upsert failed: {e._message}")


def process_stats(game_ids: list[str], start_index=0):
    print(len(game_ids), "games found for 2024–25 season")

    active_players = get_active_players()
    player_ids = set(player["id"] for player in active_players)

    # Process each game with 3-second sleep (~20 requests/min)
    for i, game_id in enumerate(game_ids[start_index:], start=start_index):
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

        insert_player_stats(stat_df, engine)


def process_advanced_stats(game_ids: list[str], start_index=0):
    for i, game_id in enumerate(game_ids[start_index:], start=start_index):
        print(f"Processing advanced stats game {i + 1}/{len(game_ids)}: {game_id}")
        advanced_df = get_boxscore_advanced(game_id)
        time.sleep(req_pause_time)

        j = 0
        for _, row in advanced_df.iterrows():
            id = game_id + "-" + str(row["teamId"]) + "-" + str(row["personId"])
            insert_advanced_stats(
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
            j = j + 1
        print(f"Successfully updated {j} advanced stats\n")


# Load environment variables and set up DB engine
load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def main():
    game_ids = get_game_ids()

    if len(sys.argv) == 3:
        if sys.argv[1] == "advanced":
            process_advanced_stats(game_ids, int(sys.argv[2]))
        else:
            process_stats(game_ids, int(sys.argv[2]))
    elif len(sys.argv) == 2:
        if sys.argv[1] == "advanced":
            process_advanced_stats(game_ids)
        else:
            process_stats(game_ids)
    else:
        process_stats(game_ids)
        time.sleep(10)
        process_advanced_stats(game_ids)

    engine.dispose()


if __name__ == "__main__":
    main()
