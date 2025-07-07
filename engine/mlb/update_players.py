import logging
import sys
from typing import Any

import pandas as pd
import statsapi
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import insert as pg_insert

from shared.db_session import get_db_session
from shared.tables import Players


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def insert_players(players_df: pd.DataFrame) -> None:
    """Insert MLB players into the database.
    
    Args:
        players_df: DataFrame containing player data
    """
    data = players_df.to_dict(orient="records")
    if not data:
        logger.info("No data to insert.")
        return

    session = get_db_session()
    try:
        stmt = pg_insert(Players).values(data)
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
        logger.info(f"✅ Updated {len(data)} MLB players")
    except IntegrityError as e:
        session.rollback()
        logger.fatal(f"⚠️ Insert failed due to integrity error: {e}")
        sys.exit(1)
    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ Unexpected error during player insert: {e}")
        sys.exit(1)
    finally:
        session.close()


def main() -> None:
    """Main function to update MLB players.
    
    Fetches current rosters for all MLB teams and updates the database.
    """
    # Get all MLB teams first
    teams_data = statsapi.get("teams", {"sportId": 1})["teams"]

    all_players: list[dict[str, Any]] = []

    for team in teams_data:
        team_id = str(team["id"])
        logger.info(f"Fetching players for {team['name']}...")

        # Get roster for each team
        try:
            roster = statsapi.get("team_roster", {"teamId": team_id})

            for player in roster["roster"]:
                player_id = str(player["person"]["id"])

                # Get detailed player info
                player_detail = statsapi.get("person", {"personId": player_id})
                player_info = player_detail["people"][0]

                player_data = {
                    "id": player_id,
                    "name": player_info["fullName"],
                    "team_id": team_id,
                    "position": (
                        player["position"]["name"] if "position" in player else None
                    ),
                    "height": player_info.get("height", None),
                    "weight": (
                        str(player_info.get("weight", ""))
                        if player_info.get("weight")
                        else None
                    ),
                    "number": player.get("jerseyNumber", None),
                    "league": "mlb",
                }
                all_players.append(player_data)

        except Exception as e:
            logger.info(f"Error fetching roster for {team['name']}: {e}")
            continue

    if all_players:
        players_df = pd.DataFrame(all_players)
        insert_players(players_df)
    else:
        logger.info("No players found to insert")


if __name__ == "__main__":
    main()