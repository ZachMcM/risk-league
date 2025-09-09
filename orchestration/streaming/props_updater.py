import concurrent.futures
import json
from datetime import datetime
from zoneinfo import ZoneInfo

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


def handle_stats_updated(data):
    """Handle incoming prop_updated messages"""
    league = data.get("league")
    if not league:
        logger.error("Received stats updated message without league")
        return

    today_str = datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")

    logger.info(f"Checking games /live/{today_str}/{league}")
    feed_req = data_feeds_req(f"/live/{today_str}/{league}")
    if feed_req.status_code == 304:
        logger.info("No games currently")
        return

    feed_data = feed_req.json()
    games = feed_data["data"][league]

    stats_list = []
    for game in games:
        player_stats_list, _ = extract_player_stats(game, league)

        for player_stats in player_stats_list:
            logger.info(f"Extracting stats for {player_stats['player_id']}")
            player_id = player_stats["playerId"]
            for stat_name, stat_value in player_stats.items():
                if stat_name in LEAGUE_VALID_STATS[league]:
                    stats_list.append(
                        {
                            "playerId": player_id,
                            "statName": stat_name,
                            "currentValue": stat_value,
                            "league": league,
                        }
                    )
                

    server_req(
        route=f"/props/live",
        method="PATCH",
        body=json.dumps(stats_list),
    )


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
