import os
import time

import pandas as pd
from dotenv import load_dotenv
from nba_api.stats.endpoints import commonplayerinfo
from nba_api.stats.static.players import get_active_players
from nba.constants import req_pause_time
from nba.tables import nba_players
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert as pg_insert

# This script initializes the database with NBA game data from multiple seasons. This script should only be run once to populate the database with historical data.

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def get_player_info(player_id):
    player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
    return player_info.get_data_frames()[0]


def insert_player(players_df, engine, nba_players):
    data = players_df.to_dict(orient="records")

    with engine.begin() as conn:
        try:
            stmt = pg_insert(nba_players).values(data)

            update_cols = {
                col: stmt.excluded[col]
                for col in ["name", "team_id", "position", "height", "weight", "number"]
            }

            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],  # primary key or unique constraint
                set_=update_cols,
            )

            conn.execute(stmt)
            print(f"✅ Upserted player: {data[0]['name']} (ID: {data[0]['id']})")
        except Exception as e:
            print(f"⚠️ Upsert failed due to error: {e}")
            return


def main():
    active_players = get_active_players()
    print(len(active_players), "active players found")
    for player in active_players:
        print(f"Fetching info for player {player['id']} - {player['full_name']}")
        player_info = get_player_info(player["id"]).iloc[0]
        time.sleep(req_pause_time)
        data = {
            "id": player_info["PERSON_ID"],
            "name": player_info["DISPLAY_FIRST_LAST"],
            "team_id": None if player_info["TEAM_ID"] == 0 else player_info["TEAM_ID"],
            "position": player_info["POSITION"],
            "height": player_info["HEIGHT"],
            "weight": player_info["WEIGHT"],
            "number": player_info["JERSEY"],
        }

        insert_player(pd.DataFrame([data]), engine, nba_players)
        engine.dispose()


if __name__ == "__main__":
    main()
