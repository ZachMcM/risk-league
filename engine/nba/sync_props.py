import signal
import sys
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from nba.my_types import stat_name_list
from nba_api.live.nba.endpoints import BoxScore, ScoreBoard
from shared.db_utils import update_prop_and_picks
from shared.db_session import get_db_session


def get_today_games():
    """Get all NBA games for today from the API.

    Returns:
        List of today's NBA games
    """
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


def get_player_stats(game_id: str):
    """Get all player stats for a given live NBA game.

    Args:
        game_id: The ID of the game

    Returns:
        List of player statistics for both teams
    """
    boxscore = BoxScore(game_id).game.get_dict()
    home_players = boxscore["homeTeam"]["players"]
    away_players = boxscore["awayTeam"]["players"]
    return home_players + away_players


def sync_props():
    """Sync prop values with live NBA game data.

    Updates database props with current live game statistics
    for all today's games.
    """
    games = get_today_games()
    session = get_db_session()
    
    try:
        for i, game in enumerate(games):
            print(f"Processing game {i + 1}/{len(games)}\n")
            player_stats = get_player_stats(game["gameId"])

            for j, player in enumerate(player_stats):
                print(f"Processing player {player['name']} {j + 1}/{len(player_stats)}\n")
                stats = player["statistics"]

                # loop through all the non combined stats
                for stat_name in stat_name_list:
                    update_prop_and_picks(
                        session,
                        stat_name["db_name"],
                        str(player["personId"]),
                        str(game["gameId"]),
                        stats[stat_name["api_name"]],
                        league="nba",
                        is_final=game["gameStatusText"] == "Final",
                    )

                pra = stats["points"] + stats["reboundsTotal"] + stats["assists"]
                update_prop_and_picks(
                    session,
                    "pra",
                    str(player["personId"]),
                    str(game["gameId"]),
                    pra,
                    league="nba",
                    is_final=game["gameStatusText"] == "Final",
                )

                pts_ast = stats["points"] + stats["assists"]
                update_prop_and_picks(
                    session,
                    "pts_ast",
                    str(player["personId"]),
                    str(game["gameId"]),
                    pts_ast,
                    league="nba",
                    is_final=game["gameStatusText"] == "Final",
                )

                reb_ast = stats["reboundsTotal"] + stats["assists"]
                update_prop_and_picks(
                    session,
                    "reb_ast",
                    str(player["personId"]),
                    str(game["gameId"]),
                    reb_ast,
                    league="nba",
                    is_final=game["gameStatusText"] == "Final",
                )

        print(f"✅ Successfully updated props\n")
    finally:
        session.close()


def main():
    """Main function that runs the NBA props sync scheduler.

    Starts a background scheduler that syncs props every 60 seconds.
    """
    sync_props()
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
