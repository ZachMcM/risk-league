import asyncio
import aiohttp
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from db.connection import get_async_pool
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
import sys

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


async def process_single_game(game, league):
    """Process stats for a single game in its own transaction"""
    game_id = game["game_ID"]
    game_status = game["status"]

    # Extract stats for this game
    player_stats_list, _ = extract_player_stats(game, league)
    stats_list: list[StatEntry] = []

    for player_stats in player_stats_list:
        player_id = player_stats["player_id"]
        for stat_name, stat_value in player_stats.items():
            if stat_name in LEAGUE_VALID_STATS[league]:
                stats_list.append({
                    "player_id": player_id,
                    "stat_name": stat_name,
                    "current_value": stat_value,
                    "league": league,
                    "game_id": game_id,
                    "status": game_status,
                })

    if not stats_list:
        return []

    props_updated = []
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            pool = await get_async_pool()
            async with pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("BEGIN")

                    try:
                        # Get existing props for this game
                        select_conditions = []
                        select_params = []
                        for stat_entry in stats_list:
                            select_conditions.append("(player_id = %s AND stat_name = %s AND league = %s AND game_id = %s)")
                            select_params.extend([
                                stat_entry["player_id"],
                                stat_entry["stat_name"],
                                stat_entry["league"],
                                stat_entry["game_id"]
                            ])

                        select_query = f"""
                            SELECT id, line, status, player_id, stat_name, league, game_id
                            FROM prop
                            WHERE {' OR '.join(select_conditions)}
                        """

                        await cur.execute(select_query, select_params)
                        existing_props = await cur.fetchall()

                        # Create lookup for existing props
                        props_lookup = {}
                        for prop in existing_props:
                            key = (prop[3], prop[4], prop[5], prop[6])  # player_id, stat_name, league, game_id
                            props_lookup[key] = {"id": prop[0], "line": prop[1], "status": prop[2]}

                        # Create lookup for players who have stats in this game
                        players_with_stats = set()
                        for stat_entry in stats_list:
                            players_with_stats.add((stat_entry["player_id"], stat_entry["game_id"]))

                        # Prepare updates for players with stats
                        update_data = []
                        for stat_entry in stats_list:
                            key = (stat_entry["player_id"], stat_entry["stat_name"], stat_entry["league"], stat_entry["game_id"])
                            if key in props_lookup:
                                prop_info = props_lookup[key]
                                status = (
                                    "resolved"
                                    if stat_entry["status"] in ["completed", "final"]
                                    or stat_entry["current_value"] > prop_info["line"]
                                    else "not_resolved"
                                )
                                update_data.append((stat_entry["current_value"], status, prop_info["id"]))

                        # Handle DNP for completed games
                        if game_status in ["completed", "final"]:
                            dnp_select_query = """
                                SELECT id, player_id, game_id
                                FROM prop
                                WHERE game_id = %s AND (status = 'not_resolved' OR status = 'did_not_play')
                            """
                            await cur.execute(dnp_select_query, (game_id,))
                            all_game_props = await cur.fetchall()

                            for prop in all_game_props:
                                prop_id, player_id, prop_game_id = prop[0], prop[1], prop[2]
                                player_game_key = (player_id, prop_game_id)

                                # If player has no stats for this game, mark as did_not_play
                                if player_game_key not in players_with_stats:
                                    update_data.append((0.0, "did_not_play", prop_id))
                                    logger.info(f"Marking prop {prop_id} as did_not_play for player {player_id} in game {game_id}")

                        # Execute updates
                        if update_data:
                            update_query = """
                                UPDATE prop
                                SET current_value = %s, status = %s
                                WHERE id = %s
                                RETURNING id
                            """

                            for update_params in update_data:
                                await cur.execute(update_query, update_params)
                                result = await cur.fetchone()
                                if result:
                                    props_updated.append(result)

                        await cur.execute("COMMIT")
                        break  # Success, exit retry loop

                    except Exception as e:
                        await cur.execute("ROLLBACK")
                        logger.error(f"Database transaction failed for game {game_id}: {e}")
                        raise e

        except Exception as e:
            if "PoolTimeout" in str(e) and attempt < max_retries - 1:
                logger.warning(f"Connection pool timeout on attempt {attempt + 1}/{max_retries} for game {game_id}, retrying in {retry_delay}s")
                await asyncio.sleep(retry_delay)
                retry_delay *= 1.5  # Modest backoff
                continue
            else:
                logger.error(f"Error processing game {game_id}: {e}")
                break

    return props_updated


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

    # Process each game individually in separate transactions
    all_props_updated = []
    for game in all_games:
        props_updated = await process_single_game(game, league)
        all_props_updated.extend(props_updated)

    # Publish all Redis messages in parallel
    if all_props_updated:
        publish_tasks = [
            publish_message_async(redis_publisher, "prop_updated", {"id": prop[0]})
            for prop in all_props_updated
        ]
        await asyncio.gather(*publish_tasks)

    await redis_publisher.aclose()

    end_time = time()
    logger.info(f"Updated {len(all_props_updated)} props. Completed in {end_time - start_time:.2f}s")


async def handle_stats_updated_safe(data):
    """Safe wrapper for handle_stats_updated that prevents listener crashes"""
    try:
        await handle_stats_updated(data)
    except Exception as e:
        logger.error(f"Error handling stats_updated message: {e}", exc_info=True)


async def listen_for_stats_updated(provided_league: str):
    """Function that listens for stats updated messages on the redis server"""
    while True:
        redis_subscriber = None
        try:
            redis_subscriber = await create_async_redis_client()
            logger.info(f"Listening for stats updated {provided_league} messages...")
            await listen_for_messages_async(
                redis_subscriber, f"stats_updated_{provided_league}", handle_stats_updated_safe
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
        if len(sys.argv) < 2:
            logger.error("You need to provide a league command line arg")
            sys.exit(1)

        provided_league = sys.argv[1]   
    
        await listen_for_stats_updated(provided_league)
    except KeyboardInterrupt:
        logger.warning("Shutting down props_worker...")
        # Ensure pool cleanup on shutdown
        from db.connection import close_async_pool
        await close_async_pool()
    except Exception as e:
        logger.error(f"Error in main: {e}")
        # Ensure pool cleanup on error
        from db.connection import close_async_pool
        await close_async_pool()


if __name__ == "__main__":
    asyncio.run(main())