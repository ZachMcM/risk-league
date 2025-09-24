from utils import setup_logger
from redis_utils import create_async_redis_client, publish_message_async
from db.connection import get_async_pool
import asyncio
from datetime import datetime
from time import time

logger = setup_logger(__name__)

POLL_INTERVAL_SECONDS = 300  # 5 minutes
MAX_MATCH_AGE_HOURS = 24  # Don't process matches older than 24 hours


async def find_matches_to_resolve():
    """Find unresolved matches that should be checked for resolution"""
    try:
        pool = await get_async_pool()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                # Find unresolved matches where:
                # 1. Match is not already resolved
                # 2. No props are available for the league (games have started/finished)
                # 3. Match was created within the last 24 hours (avoid processing very old matches)
                # Use literal string to avoid parameter substitution issues
                await cur.execute("""
                    SELECT DISTINCT m.id, m.league
                    FROM match m
                    WHERE m.resolved = false
                    AND m.created_at AT TIME ZONE 'UTC' > (NOW() AT TIME ZONE 'UTC') - INTERVAL '24 hours'
                    AND NOT EXISTS (
                        SELECT 1
                        FROM prop p
                        JOIN game g ON p.game_id = g.game_id
                        WHERE g.league = m.league
                        AND p.status = 'not_resolved'
                        AND g.start_time AT TIME ZONE 'UTC' > (NOW() AT TIME ZONE 'UTC')
                    )
                """)
                matches = await cur.fetchall()

                return [{"match_id": match[0], "league": match[1]} for match in matches]

    except Exception as e:
        logger.error(f"Error finding matches to resolve: {e}")
        return []


async def send_match_check_messages(matches):
    """Send match_check messages for each match that needs resolution"""
    if not matches:
        return

    redis_publisher = None
    try:
        redis_publisher = await create_async_redis_client()

        publish_tasks = []
        for match in matches:
            message = {
                "matchId": match["match_id"],
                "league": match["league"],
                "triggered_by": "poller",
                "timestamp": datetime.now().isoformat()
            }

            publish_tasks.append(
                publish_message_async(redis_publisher, "match_check", message)
            )

        # Send all messages in parallel
        if publish_tasks:
            await asyncio.gather(*publish_tasks)
            logger.info(f"Sent match_check messages for {len(matches)} matches")

    except Exception as e:
        logger.error(f"Error sending match_check messages: {e}")
    finally:
        if redis_publisher:
            await redis_publisher.aclose()


async def poll_matches():
    """Main polling function that checks for matches to resolve"""
    logger.info("Starting matches poller...")

    while True:
        try:
            start_time = time()

            # Find matches that need resolution
            matches_to_check = await find_matches_to_resolve()

            if matches_to_check:
                logger.info(f"Found {len(matches_to_check)} matches to check for resolution")
                await send_match_check_messages(matches_to_check)
            else:
                logger.info("No matches found that need resolution checking")

            end_time = time()
            logger.info(f"Polling cycle completed in {end_time - start_time:.2f}s")

            # Wait for next poll cycle
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

        except Exception as e:
            logger.error(f"Error in polling cycle: {e}")
            # Wait a bit before retrying to avoid rapid failure loops
            await asyncio.sleep(30)


async def main():
    """Main function that starts the matches poller"""
    try:
        await poll_matches()
    except KeyboardInterrupt:
        logger.warning("Shutting down matches_poller...")
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