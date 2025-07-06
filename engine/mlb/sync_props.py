import signal
import sys
from datetime import datetime
from typing import Any

import statsapi
from apscheduler.schedulers.background import BackgroundScheduler

from mlb.my_types import stats_arr
from shared.db_session import get_db_session
from shared.db_utils import update_prop_and_picks


def get_today_games() -> list[dict[str, Any]]:
    """Get all MLB games for today.

    Returns:
        List of today's MLB games from the API
    """
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        schedule = statsapi.schedule(start_date=today, end_date=today)
        if not schedule:
            print("⚠️ No games found today, no props to sync!")
        return schedule
    except Exception as e:
        print(f"⚠️ Error fetching today's games: {e}")
        sys.exit(1)


def get_player_stats(game_id: str) -> list[dict[str, Any]]:
    """Get all player stats for a given live MLB game.

    Args:
        game_id: ID of the game

    Returns:
        List of player statistics for all players in the game
    """
    try:
        game_data = statsapi.get("game", {"gamePk": game_id})

        if "liveData" not in game_data or "boxscore" not in game_data["liveData"]:
            print(f"No boxscore data for game {game_id}")
            return []

        boxscore = game_data["liveData"]["boxscore"]
        teams_data = boxscore.get("teams", {})
        all_players = []

        for team_side in ["away", "home"]:
            if team_side not in teams_data:
                continue

            team_data = teams_data[team_side]
            team_id = str(team_data.get("team", {}).get("id"))
            players_data = team_data.get("players", {})

            for player_key, player_info in players_data.items():
                if not player_key.startswith("ID"):
                    continue

                player_id = player_key.replace("ID", "")
                stats_data = player_info.get("stats", {})

                # Create unified player stats object
                player_stats = {
                    "player_id": player_id,
                    "raw_game_id": game_id,
                    "team_id": team_id,
                }

                # Extract batting stats
                if "batting" in stats_data:
                    batting = stats_data["batting"]
                    player_stats.update(
                        {
                            "hits": batting.get("hits", 0),
                            "home_runs": batting.get("homeRuns", 0),
                            "doubles": batting.get("doubles", 0),
                            "triples": batting.get("triples", 0),
                            "rbi": batting.get("rbi", 0),
                            "strikeouts": batting.get("strikeOuts", 0),
                        }
                    )
                else:
                    player_stats.update(
                        {
                            "hits": 0,
                            "home_runs": 0,
                            "doubles": 0,
                            "triples": 0,
                            "rbi": 0,
                            "strikeouts": 0,
                        }
                    )

                # Extract pitching stats
                if "pitching" in stats_data:
                    pitching = stats_data["pitching"]
                    player_stats.update(
                        {
                            "pitching_hits": pitching.get("hits", 0),
                            "pitching_walks": pitching.get("baseOnBalls", 0),
                            "pitches_thrown": pitching.get("numberOfPitches", 0),
                            "earned_runs": pitching.get("earnedRuns", 0),
                            "pitching_strikeouts": pitching.get("strikeOuts", 0),
                        }
                    )
                else:
                    player_stats.update(
                        {
                            "pitching_hits": 0,
                            "pitching_walks": 0,
                            "pitches_thrown": 0,
                            "earned_runs": 0,
                            "pitching_strikeouts": 0,
                        }
                    )

                all_players.append(player_stats)

        return all_players

    except Exception as e:
        print(f"Error getting player stats for game {game_id}: {e}")
        return []


def sync_props() -> None:
    """Sync props with live MLB game data.

    Updates database props with current live game statistics
    for all today's games.
    """
    games = get_today_games()

    if not games:
        print("No games currently\n")
        return

    session = get_db_session()
    try:
        for i, game in enumerate(games):
            print(f"Processing game {i + 1}/{len(games)}: {game['summary']}")

            # Only process games that are in progress or final
            if game["status"] not in ["In Progress", "Final"]:
                print(f"Skipping game {game['game_id']} - status: {game['status']}")
                continue

            player_stats = get_player_stats(game["game_id"])

            for j, player in enumerate(player_stats):
                print(
                    f"Processing player {player['player_id']} {j + 1}/{len(player_stats)}"
                )

                # Update props for each MLB stat
                for stat in stats_arr:
                    if stat in player:
                        update_prop_and_picks(
                            session,
                            stat,
                            str(player["player_id"]),
                            str(player["raw_game_id"]),
                            player[stat],
                            "mlb",
                            is_final=game["status"] == "Final",
                        )

        print(f"✅ Successfully updated props")
    finally:
        session.close()


def main() -> None:
    """Main function that runs the MLB props sync scheduler.

    Runs sync once immediately, then starts a background scheduler
    that syncs props every 60 seconds.
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