import asyncio
import aiohttp
from time import time
from datetime import datetime

from utils import setup_logger, getenv_required

logger = setup_logger(__name__)

LEAGUES = ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"]
POLL_INTERVAL_SECONDS = 300  # 5 minutes


async def send_stats_update_request(session: aiohttp.ClientSession, league: str):
    """Send a stats update request to the webhook server for a specific league"""
    try:
        webhook_url = f"{getenv_required('WEBHOOK_SERVER_BASE_URL')}/webhook/stats/league/{league}"
        api_key = getenv_required("API_KEY")

        headers = {"x-api-key": api_key}

        async with session.post(webhook_url, headers=headers) as response:
            if response.status == 200:
                logger.info(f"Successfully triggered stats update for league: {league}")
                return True
            else:
                logger.error(f"Failed to trigger stats update for league {league}: {response.status}")
                return False

    except Exception as e:
        logger.error(f"Error sending stats update request for league {league}: {e}")
        return False


async def poll_all_leagues():
    """Send stats update requests to all configured leagues"""
    try:
        async with aiohttp.ClientSession() as session:
            tasks = []
            for league in LEAGUES:
                tasks.append(send_stats_update_request(session, league))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            successful_count = sum(1 for result in results if result is True)
            logger.info(f"Stats polling completed: {successful_count}/{len(LEAGUES)} leagues updated successfully")

    except Exception as e:
        logger.error(f"Error in poll_all_leagues: {e}")


async def stats_poller():
    """Main polling function that triggers stats updates every 5 minutes"""
    logger.info("Starting stats poller...")

    while True:
        try:
            start_time = time()

            logger.info(f"Starting stats polling cycle for leagues: {', '.join(LEAGUES)}")
            await poll_all_leagues()

            end_time = time()
            logger.info(f"Stats polling cycle completed in {end_time - start_time:.2f}s")

            # Wait for next poll cycle
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

        except Exception as e:
            logger.error(f"Error in polling cycle: {e}")
            # Wait a bit before retrying to avoid rapid failure loops
            await asyncio.sleep(30)


async def main():
    """Main function that starts the stats poller"""
    try:
        await stats_poller()
    except KeyboardInterrupt:
        logger.warning("Shutting down stats_poller...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    asyncio.run(main())