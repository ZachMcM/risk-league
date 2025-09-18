import asyncio
import aiohttp
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from db.connection import get_async_connection_context
from typing import TypedDict
from extract_stats.main import extract_player_stats
from redis_utils import (
    create_async_redis_client,
    listen_for_messages_async,
    publish_message_async,
)
from utils import getenv_required, setup_logger
from prop_generation.configs.football import (
    get_football_stats_list,
)
from prop_generation.configs.baseball import (
    get_baseball_stats_list,
)
from prop_generation.configs.basketball import (
    get_basketball_stats_list,
)
from time import time

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

logger = setup_logger(__name__)


class StatEntry(TypedDict):
    player_id: int
    stat_name: str
    current_value: float
    league: str
    game_id: str
    status: str


async def handle_stats_updated(data):
    """Handle incoming stats_updated messages asynchronously"""
    start_time = time()
    league = data.get("league")
    if not league:
        logger.error("Received stats updated message without league")
        return

    # Create fresh Redis connection for this worker
    redis_publisher = await create_async_redis_client()

    est_tz = ZoneInfo("America/New_York")
    today = datetime.now(est_tz)
    yesterday = today - timedelta(days=1)

    dates_to_check = [yesterday.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")]

    all_games = []

    # Fetch all dates concurrently
    async def fetch_games_for_date(session, date_str):
        try:
            logger.info(f"Checking games /live/{date_str}/{league}")

            DATA_FEEDS_API_TOKEN = getenv_required("DATA_FEEDS_API_TOKEN")
            DATA_FEEDS_BASE_URL = getenv_required("DATA_FEEDS_BASE_URL")

            url = f"{DATA_FEEDS_BASE_URL}/live/{date_str}/{league}?RSC_token={DATA_FEEDS_API_TOKEN}"

            async with session.get(url, timeout=30) as response:
                response.raise_for_status()
                feed_data = await response.json()
                games = feed_data["data"][league]
                logger.info(f"{len(games)} {league} games found for {date_str}")
                return games
        except Exception as e:
            logger.warning(f"Failed to fetch games for {date_str}: {e}")
            return []

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_games_for_date(session, date_str) for date_str in dates_to_check]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for games in results:
            if isinstance(games, list):
                all_games.extend(games)

    logger.info(f"Total {len(all_games)} {league} games found across dates")

    stats_list: list[StatEntry] = []
    for game in all_games:
        player_stats_list, _ = extract_player_stats(game, league)
        for player_stats in player_stats_list:
            player_id = player_stats["player_id"]
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

    props_updated = []

    try:
        async with await get_async_connection_context() as conn:
            async with conn.cursor() as cur:
                await cur.execute("BEGIN")

                try:
                    for stat_entry in stats_list:
                        select_query = """
                            SELECT id, line, status
                            FROM prop
                            WHERE player_id = %s AND stat_name = %s
                            AND league = %s AND game_id = %s
                        """

                        await cur.execute(
                            select_query,
                            (
                                stat_entry["player_id"],
                                stat_entry["stat_name"],
                                stat_entry["league"],
                                stat_entry["game_id"],
                            ),
                        )

                        rows = await cur.fetchone()

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

                        await cur.execute(
                            update_query, (stat_entry["current_value"], status, rows[0])
                        )
                        result = await cur.fetchone()

                        if result:
                            props_updated.append(result)

                    await cur.execute("COMMIT")

                except Exception as e:
                    await cur.execute("ROLLBACK")
                    logger.error(f"Database transaction failed: {e}")
                    raise e

        # Publish all Redis messages in parallel
        if props_updated:
            publish_tasks = [
                publish_message_async(redis_publisher, "prop_updated", {"id": prop[0]})
                for prop in props_updated
            ]
            await asyncio.gather(*publish_tasks)

    except Exception as e:
        logger.error(f"Error handling stats update: {e}")
    finally:
        await redis_publisher.aclose()

    end_time = time()
    logger.info(f"Updated {len(props_updated)} props. Completed in {end_time - start_time:.2f}s")


async def handle_stats_updated_safe(data):
    """Safe wrapper for handle_stats_updated that prevents listener crashes"""
    try:
        await handle_stats_updated(data)
    except Exception as e:
        logger.error(f"Error handling stats_updated message: {e}", exc_info=True)


async def listen_for_stats_updated():
    """Function that listens for stats updated messages on the redis server"""
    while True:
        redis_subscriber = None
        try:
            redis_subscriber = await create_async_redis_client()
            logger.info("Listening for stats updated messages...")
            await listen_for_messages_async(
                redis_subscriber, "stats_updated", handle_stats_updated_safe
            )
        except Exception as e:
            logger.error(f"Error in listener, restarting: {e}")
            await asyncio.sleep(5)  # Brief delay before restart
        finally:
            if redis_subscriber:
                await redis_subscriber.aclose()


async def main():
    """Main function that listens for stats updated messages."""
    try:
        await listen_for_stats_updated()
    except KeyboardInterrupt:
        logger.warning("Shutting down props_worker...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    asyncio.run(main())
