import concurrent.futures
import json
from datetime import datetime
from zoneinfo import ZoneInfo

from extract_stats.main import extract_player_stats
from redis_utils import create_redis_client, listen_for_messages
from utils import data_feeds_req, getenv_required, server_req, setup_logger
from prop_generation.configs.football import (
    get_football_stats_list,
    get_football_prop_configs
)
from prop_generation.configs.baseball import (
    get_baseball_stats_list,
    get_baseball_prop_configs
)
from prop_generation.configs.basketball import (
    get_basketball_stats_list,
    get_basketball_prop_configs
)

VALID_FOOTBALL_STATS = get_football_stats_list()
VALID_BASKETBALL_STATS = get_basketball_stats_list()
VALID_BASEBALL_STATS = get_baseball_stats_list()

# Get prop configs to create target field mappings
FOOTBALL_CONFIGS = get_football_prop_configs()
BASKETBALL_CONFIGS = get_basketball_prop_configs()
BASEBALL_CONFIGS = get_baseball_prop_configs()

# Create mappings from target_field to stat_name for validation
FOOTBALL_TARGET_FIELDS = {config.target_field: stat_name for stat_name, config in FOOTBALL_CONFIGS.items()}
BASKETBALL_TARGET_FIELDS = {config.target_field: stat_name for stat_name, config in BASKETBALL_CONFIGS.items()}
BASEBALL_TARGET_FIELDS = {config.target_field: stat_name for stat_name, config in BASEBALL_CONFIGS.items()}

LEAGUE_VALID_STATS = {
    "MLB": VALID_BASEBALL_STATS,
    "NBA": VALID_BASKETBALL_STATS,
    "NFL": VALID_FOOTBALL_STATS,
    "NCAAFB": VALID_FOOTBALL_STATS,
    "NCAABB": VALID_BASKETBALL_STATS,
}

LEAGUE_TARGET_FIELD_MAPPINGS = {
    "MLB": BASEBALL_TARGET_FIELDS,
    "NBA": BASKETBALL_TARGET_FIELDS,
    "NFL": FOOTBALL_TARGET_FIELDS,
    "NCAAFB": FOOTBALL_TARGET_FIELDS,
    "NCAABB": BASKETBALL_TARGET_FIELDS,
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

    feed_data = feed_req.json()
    games = feed_data["data"][league]
    logger.info(f"{len(games)} {league} Games found")

    stats_list = []
    for game in games:
        player_stats_list, _ = extract_player_stats(game, league)
        for player_stats in player_stats_list:
            player_id = player_stats["playerId"]
            for stat_name, stat_value in player_stats.items():
                if stat_name in LEAGUE_TARGET_FIELD_MAPPINGS[league]:
                    db_stat_name = LEAGUE_TARGET_FIELD_MAPPINGS[league][stat_name]
                    stats_list.append(
                        {
                            "playerId": player_id,
                            "statName": db_stat_name,
                            "currentValue": stat_value,
                            "league": league,
                            "gameId": game['game_ID']
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
