import signal
import sys
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from shared.db_session import get_db_session
import redis


def finalize_parlays() -> None:
    """Finalize parlay statuses and update respective match user balances based on stake and number of legs.

    First finds all parlays created today where all picks are final and the status is not resolved.
    Then updates the status of the parlay and updates the user balance.
    """

    session = get_db_session()
    try:
        # TODO
        None
    finally:
        session.close()


def listen_for_pick_events():
    """Function that listens for a pick finalize event from redis."""


def main():
    """Main function that runs the finalize parlays scheduler.

    Starts a background scheduler that syncs props every 60 seconds.
    """


if __name__ == "__main__":
    main()
