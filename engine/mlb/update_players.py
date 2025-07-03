import os
import pandas as pd
import statsapi
from dotenv import load_dotenv
from shared.tables import t_players
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import insert as pg_insert

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def insert_players(players_df, engine):
    data = players_df.to_dict(orient="records")
    if not data:
        print("No data to insert.")
        return

    with engine.begin() as conn:
        try:
            stmt = pg_insert(t_players).values(data)
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
            conn.execute(stmt)
            print(f"✅ Inserted {len(data)} MLB players")
        except IntegrityError as e:
            print(f"⚠️ Insert failed due to integrity error: {e._message}")
            return


def main():
    # Get all MLB teams first
    teams_data = statsapi.get("teams", {"sportId": 1})["teams"]

    all_players = []

    for team in teams_data:
        team_id = str(team["id"])
        print(f"Fetching players for {team['name']}...")

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
            print(f"Error fetching roster for {team['name']}: {e}")
            continue

    if all_players:
        players_df = pd.DataFrame(all_players)
        insert_players(players_df, engine)
    else:
        print("No players found to insert")

    engine.dispose()


if __name__ == "__main__":
    main()
