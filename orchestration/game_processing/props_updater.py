from utils import setup_logger
import signal
import sys
import json
from concurrent.futures import ThreadPoolExecutor

from apscheduler.schedulers.background import BackgroundScheduler
from constants import LEAGUES
from datetime import datetime
from zoneinfo import ZoneInfo
from utils import data_feeds_req, server_req
from constants import LEAGUES

logger = setup_logger(__name__)


def process_league(league: str):
    """Process a single league and return completion status."""
    today_str = datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
    try:
        live_feed_req = data_feeds_req(f"/live/{today_str}/{league}")
        if live_feed_req.status_code == 304:
            logger.info(f"No live games for {league} today, skipping")
            return None

        live_feed_data = live_feed_req.json()

        server_req(
            route=f"/props/league/{league}",
            method="POST",
            body=json.dumps(live_feed_data),
        )
    except Exception as e:
        logger.error(f"Error processing {league}: {e}")
        return None


def update_props():
    """Updates all the prop currentValues, and updates the prop's status."""
    # Process all leagues in parallel
    with ThreadPoolExecutor(max_workers=len(LEAGUES)) as executor:
        # Submit all league processing tasks
        {executor.submit(process_league, league): league for league in LEAGUES}


def main():
    """Main function that runs the NBA props sync scheduler.

    Starts a background scheduler that syncs props every 60 seconds.
    """
    update_props()
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_props, "interval", seconds=60)
    scheduler.start()

    try:
        signal.pause()
    except (KeyboardInterrupt, SystemExit):
        logger.warning("Exiting...")
        scheduler.shutdown()
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        scheduler.shutdown()
        sys.exit(1)


if __name__ == "__main__":
    main()
