from shared.utils import setup_logger
import sys
import time

import pandas as pd
from nba.constants import req_pause_time
from nba.utils import clean_minutes, get_current_season, get_game_type
from nba_api.stats.endpoints import (
    boxscoreadvancedv3,
    boxscoretraditionalv3,
    leaguegamefinder,
)
from nba_api.stats.static.players import get_active_players
from shared.tables import NbaGames, NbaPlayerStats
from shared.date_utils import get_yesterday_eastern_formatted
from shared.db_session import get_db_session
from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

# This script updates the database with all the NBA games from the past day

step_sleep_time = 3


logger = setup_logger(__name__)


def get_previous_day_games(test=None):
    """Get all NBA games from the previous day.
    
    Args:
        test: Optional test date string for testing purposes
        
    Returns:
        Pandas DataFrame containing game data from previous day
    """
    season = get_current_season()
    yesterday_str = get_yesterday_eastern_formatted("%m/%d/%Y")  # Format: MM/DD/YYYY
    if test is not None:
        yesterday_str = test
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
        logger.info("No games played yesterday! exiting")
        sys.exit(0)  # Return empty if no data

    return pd.concat(dfs, ignore_index=True)


def insert_games(games_df, session):
    """Insert NBA games into the database.
    
    Args:
        games_df: DataFrame containing game data
        session: SQLAlchemy database session
    """
    data = games_df.to_dict(orient="records")

    if not data:
        logger.info("No data to insert.")
        return

    try:
        stmt = pg_insert(NbaGames).values(data)
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
        session.execute(stmt)
        session.commit()
        logger.info(f"✅ Inserted {len(data)} games\n")
    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ Insert failed due to error: {e}")
        sys.exit(1)


def get_boxscore(game_id):
    """Get traditional boxscore data for a game.
    
    Args:
        game_id: ID of the game
        
    Returns:
        DataFrame containing traditional boxscore data
    """
    try:
        boxscore = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id)
        return boxscore.get_data_frames()[0]
    except Exception as e:
        logger.fatal(f"⚠️ Error fetching boxscore for game {game_id}: {e}")
        sys.exit(1)


def get_boxscore_advanced(game_id):
    """Get advanced boxscore data for a game.
    
    Args:
        game_id: ID of the game
        
    Returns:
        DataFrame containing advanced boxscore data
    """
    try:
        boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)
        return boxscore.get_data_frames()[0]
    except Exception as e:
        logger.fatal(f"⚠️ Error fetching boxscore advanced for game {game_id}: {e}")
        sys.exit(1)


def get_team_advanced(game_id):
    """Get team advanced stats for a game.
    
    Args:
        game_id: ID of the game
        
    Returns:
        DataFrame containing team advanced stats
    """
    try:
        boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)
        return boxscore.get_data_frames()[1]
    except Exception as e:
        logger.fatal(f"⚠️ Error fetching boxscore advanced for game {game_id}: {e}")
        sys.exit(1)


def insert_player_advanced_stats(
    session,
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
    """Insert player advanced stats into the database.
    
    Args:
        session: SQLAlchemy database session
        id: Player record ID
        true_shooting: True shooting percentage
        usage_rate: Usage rate percentage
        reb_pct: Rebound percentage
        dreb_pct: Defensive rebound percentage
        oreb_pct: Offensive rebound percentage
        ast_pct: Assist percentage
        ast_ratio: Assist ratio
        tov_ratio: Turnover ratio
    """
    try:
        stmt = (
            update(NbaPlayerStats)
            .where(NbaPlayerStats.id == id)
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

        session.execute(stmt)
        session.commit()
        logger.info(f"✅ Inserted player {id} advanced stats\n")
    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ There was an error inserting advanced stats for game {id}, {e}")
        sys.exit(1)


def insert_player_stats(stats_df, session):
    """Insert basic player stats into the database.
    
    Args:
        stats_df: DataFrame containing player stats
        session: SQLAlchemy database session
    """
    data = stats_df.to_dict(orient="records")
    if not data:
        logger.fatal("⚠️ No data to insert.")
        sys.exit(1)

    try:
        stmt = pg_insert(NbaPlayerStats).values(data)
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
        stmt = stmt.on_conflict_do_update(
            index_elements=["player_id", "game_id"], set_=update_cols
        )
        session.execute(stmt)
        session.commit()
        logger.info(f"✅ Upserted {len(data)} player stats\n")
    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ Upsert failed: {e}")
        sys.exit(1)


def remove_duplicates(session):
    """Remove duplicate NBA player stats records.
    
    Args:
        session: SQLAlchemy database session
    
    Keeps the most recent record for each player-game combination.
    """
    try:
        # Subquery to get the IDs we want to keep (most recent for each player_id, game_id pair)
        subquery = (
            select(NbaPlayerStats.id)
            .distinct(NbaPlayerStats.player_id, NbaPlayerStats.game_id)
            .order_by(
                NbaPlayerStats.player_id,
                NbaPlayerStats.game_id,
                NbaPlayerStats.updated_at.desc(),
            )
        )

        # Delete records whose ID is not in the subquery
        stmt = delete(NbaPlayerStats).where(
            NbaPlayerStats.id.notin_(subquery)
        )

        result = session.execute(stmt)
        session.commit()
        logger.info(f"✅ Removed {result.rowcount} duplicate NBA player stats records")

    except Exception as e:
        session.rollback()
        logger.error(f"🚨 There was an error trying to delete duplicates: {e}")


def insert_team_advanced_stats(
    session,
    pace: float,
    tov_ratio: float,
    tov_pct: float,
    off_rating: float,
    def_rating: float,
    game_id: str,
):
    """Insert team advanced stats into the database.
    
    Args:
        session: SQLAlchemy database session
        pace: Team pace statistic
        tov_ratio: Turnover ratio
        tov_pct: Turnover percentage
        off_rating: Offensive rating
        def_rating: Defensive rating
        game_id: ID of the game
    """
    try:
        stmt = (
            update(NbaGames)
            .where(NbaGames.id == game_id)
            .values(
                pace=pace,
                tov_ratio=tov_ratio,
                tov_pct=tov_pct,
                off_rating=off_rating,
                def_rating=def_rating,
            )
        )

        session.execute(stmt)
        session.commit()
        logger.info(f"✅ Inserted game {game_id} advanced stats\n")
    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ There was an error inserting, {e}")
        sys.exit(1)


def main():
    """Main function to update NBA stats.
    
    Processes previous day's games and updates both team and player stats.
    """
    test_date = None
    if len(sys.argv) == 2:
        test_date = sys.argv[1]

    games = get_previous_day_games(test_date)

    game_ids = games["GAME_ID"].unique().tolist()
    session = get_db_session()
    
    try:
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
        insert_games(games, session)

        time.sleep(step_sleep_time)

        # inserts team advanced stats per game
        i = 0
        for _, row in games.iterrows():
            logger.info(f"Processing advanced stats for game {row['id']} {i + 1}/{len(games)}")
            game_id = row["id"][: row["id"].find("-")]
            team_id = row["team_id"]

            advanced_df = get_team_advanced(game_id)
            time.sleep(req_pause_time)
            team_row = advanced_df[advanced_df["teamId"] == team_id].iloc[0]

            insert_team_advanced_stats(
                session,
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
            logger.info(f"Processing game {i + 1}/{len(game_ids)}: {game_id}")
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

            insert_player_stats(stat_df, session)

        time.sleep(step_sleep_time)

        # inserts the advanced stats after regular stats are inserted
        for i, game_id in enumerate(game_ids):
            logger.info(f"Processing advanced stats game {i + 1}/{len(game_ids)}: {game_id}")
            advanced_df = get_boxscore_advanced(game_id)
            time.sleep(req_pause_time)

            for _, row in advanced_df.iterrows():

                id = game_id + "-" + str(row["teamId"]) + "-" + str(row["personId"])
                insert_player_advanced_stats(
                    session,
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

        remove_duplicates(session)
    finally:
        session.close()


if __name__ == "__main__":
    main()
