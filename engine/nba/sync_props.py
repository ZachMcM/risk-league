import os
import signal
import sys
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from nba.my_types import stat_name_list
from nba_api.live.nba.endpoints import BoxScore, ScoreBoard
from shared.db_utils import update_prop
from sqlalchemy import create_engine

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


# gets all the games for today
def get_today_games():
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        scoreboard = ScoreBoard()
        games = ScoreBoard().games.get_dict()
        if scoreboard.score_board_date != today:
            print("⚠️ No games found today, no props to generate!")
        return games
    except Exception as e:
        print(f"⚠️ Error fetching today's games: {e}")
        sys.exit(1)


# gets all the player stats for a given live game
def get_player_stats(game_id: str):
    boxscore = BoxScore(game_id).game.get_dict()
    home_players = boxscore["homeTeam"]["players"]
    away_players = boxscore["awayTeam"]["players"]
    return home_players + away_players


def sync_props():
    games = get_today_games()

    for i, game in enumerate(games):
        print(f"Processing game {i + 1}/{len(games)}\n")
        player_stats = get_player_stats(game["gameId"])

        for j, player in enumerate(player_stats):
            print(f"Processing player {player['name']} {j + 1}/{len(player_stats)}\n")
            stats = player["statistics"]

            # loop through all the non combined stats
            for stat_name in stat_name_list:
                update_prop(
                    engine,
                    stat_name["db_name"],
                    str(player["personId"]),
                    str(game["gameId"]),
                    stats[stat_name["api_name"]],
                    league="nba",
                )

            pra = stats["points"] + stats["reboundsTotal"] + stats["assists"]
            update_prop("pra", str(player["personId"]), str(game["gameId"]), pra)

            pts_ast = stats["points"] + stats["assists"]
            update_prop(
                "pts_ast", str(player["personId"]), str(game["gameId"]), pts_ast
            )

            reb_ast = stats["reboundsTotal"] + stats["assists"]
            update_prop(
                "reb_ast", str(player["personId"]), str(game["gameId"]), reb_ast
            )

    print(f"✅ Successfully updated props\n")
    engine.dispose()


def main():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sync_props, "interval", seconds=60)
    scheduler.start()

    try:
        signal.pause()
    except (KeyboardInterrupt, SystemExit):
        print("Exiting...")
        scheduler.shutdown()
    except Exception as e:
        print(f"Unhandled exception: {e}")
        scheduler.shutdown()
        sys.exit(1)


if __name__ == "__main__":
    main()
