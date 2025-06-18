import os

import pandas as pd
from dotenv import load_dotenv
from nba_api.stats.static import teams
from nba_tables import nba_teams
from sqlalchemy import create_engine, insert
from sqlalchemy.exc import IntegrityError

# This script initializes the database with NBA teams. This script should only be run once to populate the database with historical data.
load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def insert_teams(teams_df, engine, nba_teams):
    # Convert DataFrame to list of dicts
    data = teams_df.to_dict(orient="records")

    if not data:
        print("No data to insert.")
        return

    with engine.begin() as conn:
        try:
            stmt = insert(nba_teams).values(data)
            conn.execute(stmt)
            print(f"✅ Inserted {len(data)} NBA teams")
        except IntegrityError as e:
            print(f"⚠️ Insert failed due to integrity error: {e._message}")
            return


def main():
    teams_list = teams.get_teams()
    teams_df = pd.DataFrame(teams_list)

    insert_teams(teams_df, engine, nba_teams)
    # Close the engine connection
    engine.dispose()


if __name__ == "__main__":
    main()
