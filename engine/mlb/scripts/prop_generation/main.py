from datetime import datetime
import statsapi
import pandas as pd
from dotenv import load_dotenv
import os
from sqlalchemy import and_, create_engine, or_, select
import sys
from mlb.my_types import PlayerData, MlbGame, MlbPlayerStats
from shared.my_types import Player
from shared.tables import t_players, t_mlb_games, t_mlb_player_stats
from shared.utils import db_response_to_json, json_to_csv, pretty_print
from time import time
from mlb.constants import n_games

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def get_player_from_db(id: str) -> Player:
    try:
        with engine.connect() as conn:
            stmt = select(t_players).where(
                t_players.c.id == id,
            )
            result = conn.execute(stmt).first()
            if result is None:
                return None
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ Error fetching player {id}: {e}")
        sys.exit(1)


def get_game_players(game_id) -> list[Player]:
    """Returns a list of all players (PlayerData dict) for a given game"""
    try:
        game_data = statsapi.get("game", {"gamePk": game_id})
        boxscore = game_data["liveData"]["boxscore"]
        players = []

        teams_data = boxscore.get("teams", {})
        for team_side in ["away", "home"]:
            if team_side not in teams_data:
                continue

            team_data = teams_data[team_side]

            players_data = team_data.get("players", {})
            for player_key, _ in players_data.items():
                if not player_key.startswith("ID"):
                    continue
                player_id = player_key.replace("ID", "")
                player_data = get_player_from_db(player_id)
                if player_data is not None:
                    players.append(player_data)

        return players

    except Exception as e:
        print(f"Getting players failed due to: ${e}")
        sys.exit(1)


def get_player_last_games(player_id: str) -> list[MlbPlayerStats] | None:
    try:
        with engine.connect() as conn:
            j = t_mlb_player_stats.join(
                t_mlb_games, t_mlb_player_stats.c.game_id == t_mlb_games.c.id
            )

            stmt = (
                select(t_mlb_player_stats)
                .select_from(j)
                .where(
                    or_(
                        t_mlb_games.c.game_type == "R",
                        t_mlb_games.c.game_type == "P",
                    )
                )
                .where(t_mlb_player_stats.c.player_id == str(player_id))
                .order_by(t_mlb_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            # if no games were found or
            # the player didn't play enough out of the teams last n games
            # we return null to skip this player

            if len(last_games) != n_games:
                print(f"🚨 Skipping player {player_id}\n")
                return None
            else:
                return last_games

    except Exception as e:
        print(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


def main():
    start = time()
    today = datetime.today().strftime("%Y-%m-%d")
    print("Fetching today's MLB games from")

    # Get schedule for date range
    schedule = statsapi.schedule(start_date=today, end_date=today)
    print(f"Found {len(schedule)} games")

    player_data_list: list[PlayerData] = []
    team_games_cache: dict[str, list[MlbGame]] = {}
    total_props_generated = 0

    regular_season_only = True

    for i, game in enumerate(schedule):
        print(
            f"Getting initial game data for game {game['game_id']} {i + 1}/{len(schedule)}\n"
        )
        if regular_season_only == True and game["game_type"] == "R":
            regular_season_only = False

        home_team_id = game["home_id"]
        away_team_id = game["away_id"]
        players = get_game_players(game["game_id"])

        for player in players:
            player_last_games = get_player_last_games(player["id"])

            if player_last_games == None:
                continue
            matchup = ""
            if player["team_id"] == home_team_id:
                matchup = away_team_id
            else:
                matchup = home_team_id

            player_data_list.append(
                {
                    "matchup": matchup,
                    "player": player,
                    "game_id": game["game_id"],
                    "last_games": player_last_games,
                    "game_start_time": game["game_datetime"],
                }
            )
            
    print(len(player_data_list))
    json_to_csv(player_data_list)

    end = time()
    print(
        f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
    )

    engine.dispose()


if __name__ == "__main__":
    main()
