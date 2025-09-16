import concurrent.futures
import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from db.connection import get_connection_context
from typing import TypedDict

from extract_stats.main import extract_player_stats
from redis_utils import create_redis_client, listen_for_messages
from utils import data_feeds_req, getenv_required, server_req, setup_logger
from prop_generation.configs.football import (
    get_football_stats_list,
)
from prop_generation.configs.baseball import (
    get_baseball_stats_list,
)
from prop_generation.configs.basketball import (
    get_basketball_stats_list,
)

VALID_FOOTBALL_STATS = get_football_stats_list()
VALID_BASKETBALL_STATS = get_basketball_stats_list()
VALID_BASEBALL_STATS = get_baseball_stats_list()

LEAGUE_VALID_STATS = {
    "MLB": VALID_BASEBALL_STATS,
    "NBA": VALID_BASKETBALL_STATS,
    "NFL": VALID_FOOTBALL_STATS,
    "NCAAFB": VALID_FOOTBALL_STATS,
    "NCAABB": VALID_BASKETBALL_STATS,
}

STATS_UPDATER_MAX_WORKERS = int(getenv_required("STATS_UPDATER_MAX_WORKERS"))

logger = setup_logger(__name__)

redis_client = create_redis_client()


class StatEntry(TypedDict):
    player_id: int
    stat_name: str
    current_value: float
    league: str
    game_id: str
    status: str


def handle_stats_updated(data):
    """Handle incoming prop_updated messages"""
    league = data.get("league")
    if not league:
        logger.error("Received stats updated message without league")
        return

    est_tz = ZoneInfo("America/New_York")
    today = datetime.now(est_tz)
    yesterday = today - timedelta(days=1)

    dates_to_check = [yesterday.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")]

    all_games = []
    for date_str in dates_to_check:
        try:
            logger.info(f"Checking games /live/{date_str}/{league}")
            feed_req = data_feeds_req(f"/live/{date_str}/{league}")
            feed_data = feed_req.json()
            games = feed_data["data"][league]
            logger.info(f"{len(games)} {league} games found for {date_str}")
            all_games.extend(games)
        except Exception as e:
            logger.warning(f"Failed to fetch games for {date_str}: {e}")

    logger.info(f"Total {len(all_games)} {league} games found across dates")

    stats_list: list[StatEntry] = []
    for game in all_games:
        player_stats_list, _ = extract_player_stats(game, league)
        for player_stats in player_stats_list:
            player_id = player_stats["playerId"]
            for stat_name, stat_value in player_stats.items():
                if stat_name in LEAGUE_VALID_STATS[league]:
                    stats_list.append(
                        {
                            "player_id": player_id,
                            "stat_name": stat_name,
                            "current_value": stat_value,
                            "league": league,
                            "game_id": game["game_ID"],
                            "status": game["status"],
                        }
                    )

    total_props_updated = []

    with get_connection_context() as conn:
        with conn.cursor() as cur:
            for stat_entry in stats_list:
                select_query = """
                    SELECT id, line, status 
                    FROM prop 
                    WHERE player_id = %s AND stat_name = %s 
                    AND league = %s AND game_id = %s
                """

                cur.execute(
                    select_query,
                    (
                        stat_entry["player_id"],
                        stat_entry["stat_name"],
                        stat_entry["league"],
                        stat_entry["game_id"],
                    ),
                )

                rows = cur.fetchone()

                if not rows:
                    continue

                update_query = """
                    UPDATE prop
                    SET current_value = %s, status = %s
                    WHERE id = %s
                    RETURNING id
                """

                status = (
                    "resolved"
                    if stat_entry["status"] in ["completed", "final"]
                    or stat_entry["current_value"] > rows[1]
                    else "not_resolved"
                )

                cur.execute(
                    update_query, (stat_entry["current_value"], status, rows[0])
                )
                result = cur.fetchone()

                if result:
                    total_props_updated.append(result)
                    redis_client.publish(
                        channel="prop_updated", message=json.dumps({"id": result[0]})
                    )
                    
    logger.info(f"Updated {len(total_props_updated)} props")


def listen_for_stats_updated():
    """Function that listens for a prop updated message on the redis server"""
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=STATS_UPDATER_MAX_WORKERS
    ) as executor:

        def async_handler(data):
            executor.submit(handle_stats_updated, data)

        logger.info("Listening for prop updated messages...")
        listen_for_messages(redis_client, "stats_updated", async_handler)


def main():
    """Main function that listens for prop updated messages."""
    try:
        listen_for_stats_updated()
    except KeyboardInterrupt:
        logger.warning("Shutting down update_parlay_picks...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
