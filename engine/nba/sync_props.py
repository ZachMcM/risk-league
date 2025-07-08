import logging
import signal
import sys

from apscheduler.schedulers.background import BackgroundScheduler
from nba_api.live.nba.endpoints import BoxScore
from shared.get_today_games import get_today_nba_games as get_today_games
from shared.db_utils import update_prop
from shared.db_session import get_db_session
from nba.prop_configs import get_nba_stats_list

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def get_player_stats(game_id: str):
    """Get all player stats for a given live NBA game.

    Args:
        game_id: The ID of the game

    Returns:
        List of player statistics for both teams
    """
    boxscore = BoxScore(game_id).game.get_dict()
    game_players: list[dict] = boxscore["homeTeam"]["players"] + boxscore["awayTeam"]["players"]
    
    all_players = []
    for player in game_players:
        stats: dict = player.get("statistics", {})
        player_stats = {
            "player_id": player.get("personId", None),
            "raw_game_id": game_id,
            "pts": stats.get("points", 0),
            "fgm": stats.get("fieldGoalsMade", 0),
            "fga": stats.get("fieldGoalsAttempted", 0),
            "blk": stats.get("blocks", 0),
            "ast": stats.get("assists", 0),
            "fta": stats.get("freeThrowsAttempted", 0),
            "ftm": stats.get("freeThrowsMade", 0),
            "min": stats.get("minutes", 0),
            "reb": stats.get("reboundsTotal", 0),
            "oreb": stats.get("reboundsOffensive", 0),
            "dreb": stats.get("reboundsDefensive", 0),
            "stl": stats.get("steals", 0),
            "three_pa": stats.get("threePointersAttempted", 0),
            "three_pm": stats.get("threePointersMade", 0),
            "tov": stats.get("turnovers", 0)
        }
        all_players.append(player_stats)
    return all_players


def sync_props():
    """Sync prop values with live NBA game data.

    Updates database props with current live game statistics
    for all today's games.
    """
    games = get_today_games()
    session = get_db_session()
    
    try:
        for i, game in enumerate(games):
            logger.info(f"Processing game {i + 1}/{len(games)}\n")
            
            player_stats = get_player_stats(game["gameId"])

            for j, player in enumerate(player_stats):
                logger.info(f"Processing player {player['player_id']} {j + 1}/{len(player_stats)}\n")
                
                nba_stats = get_nba_stats_list()

                # loop through all the non combined stats
                for stat in nba_stats:
                    if stat in player:
                        update_prop(
                            session,
                            stat,
                            str(player["player_id"]),
                            str(player["raw_game_id"]),
                            player[stat],
                            league="nba",
                            is_final=game["gameStatusText"] == "Final",
                        )

                pra = player["pts"] + player["reb"] + player["ast"]
                update_prop(
                    session,
                    "pra",
                    str(player["player_id"]),
                    str(player["raw_game_id"]),
                    pra,
                    league="nba",
                    is_final=game["gameStatusText"] == "Final",
                )

                pts_ast = player["pts"] + player["ast"]
                update_prop(
                    session,
                    "pts_ast",
                    str(player["player_id"]),
                    str(player["raw_game_id"]),
                    pts_ast,
                    league="nba",
                    is_final=game["gameStatusText"] == "Final",
                )

                reb_ast = player["reb"] + player["ast"]
                update_prop(
                    session,
                    "reb_ast",
                    str(player["player_id"]),
                    str(player["raw_game_id"]),
                    reb_ast,
                    league="nba",
                    is_final=game["gameStatusText"] == "Final",
                )

        logger.info(f"✅ Successfully updated props\n")
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
        logger.info("Exiting...")
        scheduler.shutdown()
    except Exception as e:
        logger.fatal(f"Unhandled exception: {e}")
        scheduler.shutdown()
        sys.exit(1)


if __name__ == "__main__":
    main()
