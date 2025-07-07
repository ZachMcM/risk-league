import logging
import time

import pandas as pd
from nba.constants import req_pause_time
from nba_api.stats.endpoints import commonteamroster
from nba_api.stats.static import teams
from shared.tables import Players
from shared.db_session import get_db_session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from nba.utils import get_current_season

# This script is to be ran periodically to update the players with the latest nba rosters.


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def get_team_players(team_id, season):
    """Get roster data for an NBA team.

    Args:
        team_id: NBA team ID
        season: Season string (e.g., "2023-24")

    Returns:
        DataFrame containing team roster data
    """
    try:
        roster = commonteamroster.CommonTeamRoster(team_id=team_id, season=season)
        return roster.get_data_frames()[0]
    except Exception as e:
        logger.warning(f"Error fetching roster for team {team_id}: {e}")
        return pd.DataFrame()


def insert_team_players(data, session):
    """Insert NBA team players into the database.

    Args:
        data: DataFrame containing player data
        session: SQLAlchemy database session
    """
    records = data.to_dict(orient="records")

    try:
        stmt = pg_insert(Players).values(records)

        update_cols = {
            col: stmt.excluded[col]
            for col in [
                "name",
                "team_id",
                "position",
                "height",
                "weight",
                "number",
                "league",
            ]
        }

        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],  # primary key or unique constraint
            set_=update_cols,
        )

        session.execute(stmt)
        session.commit()
        logger.info(f"✅ Upserted {len(data)} players")
    except IntegrityError as e:
        session.rollback()
        logger.error(f"⚠️ Upsert failed due to integrity error: {e._message}")


def main():
    """Main function to update NBA players.

    Fetches current rosters for all NBA teams and updates the database.
    """
    season = get_current_season()
    team_list = teams.get_teams()
    session = get_db_session()

    try:
        for team in team_list:
            team_id = team["id"]
            players_df = get_team_players(team_id, season)
            players_df["league"] = "nba"

            data = players_df.rename(
                columns={
                    "PLAYER_ID": "id",
                    "PLAYER": "name",
                    "TeamID": "team_id",
                    "POSITION": "position",
                    "HEIGHT": "height",
                    "WEIGHT": "weight",
                    "NUM": "number",
                }
            )[
                [
                    "id",
                    "name",
                    "team_id",
                    "position",
                    "height",
                    "weight",
                    "number",
                    "league",
                ]
            ]

            insert_team_players(data, session)
            time.sleep(req_pause_time)
    finally:
        session.close()


if __name__ == "__main__":
    main()
