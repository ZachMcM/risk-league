from utils import setup_logger
import signal
import sys
import json

from apscheduler.schedulers.background import BackgroundScheduler
from constants import LEAGUES
from datetime import datetime
from zoneinfo import ZoneInfo
from utils import data_feeds_req, server_req

logger = setup_logger(__name__)


def resolve_matches():
    """Updates all the matches if all today's games are finished.

    Function checks if all the games for each sport today are finalized.
    If not return out. If so we find every match created today and updates it.
    """
    completed_leagues = []

    for league in LEAGUES:
        today_str = datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
        live_feed_req = data_feeds_req(f"/live/{today_str}/{league}")
        if live_feed_req.status_code == 304:
            logger.info(f"No games for {league} today, skipping")
            continue

        live_feed_data = live_feed_req.json()
        league_games_list = live_feed_data["data"][league]

        for game in league_games_list:
            if game["status"] != "completed":
                break
        else:
            completed_leagues.append(league)

    if completed_leagues:
        server_req(
            route="/matches",
            method="PATCH",
            body=json.dumps({"completedLeagues": completed_leagues}),
        )


def main():
    """Main function that runs the NBA props sync scheduler.

    Starts a background scheduler that syncs props every 60 seconds.
    """
    resolve_matches()
    scheduler = BackgroundScheduler()
    scheduler.add_job(resolve_matches, "interval", seconds=60)
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
