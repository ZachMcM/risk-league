import asyncio
from shared.utils import setup_logger

from shared.db_session import get_db_session
from shared.pubsub_utils import listen_for_messages
from shared.socket_utils import send_message as send_socket_message
from shared.tables import ParlayPicks
from sqlalchemy import select
from sqlalchemy.orm import Session
from system.constants import PARLAY_MULTIPLIERS

logger = setup_logger(__name__)


def update_parlay(session: Session, pick_id: str):
    """Updates a parlay if all the picks are updated"""
    pick = session.execute(
        select(ParlayPicks).where(ParlayPicks.id == pick_id)
    ).scalar_one_or_none()
    if pick is None:
        return

    parlay = pick.parlay
    picks = parlay.parlay_picks

    hit_count = 0

    for pick in picks:
        if pick.status == "not_resolved":
            return
        if pick.status == "hit":
            hit_count += 1

    match_user = parlay.match_user

    if hit_count == len(picks):
        parlay.status = "hit"
        multiplier = PARLAY_MULTIPLIERS.get(len(picks))
        delta = parlay.stake * multiplier
        match_user.balance += delta
    else:
        parlay.status = "missed"
        delta = parlay.stake

    session.commit()

    async def send_updates():
        send_socket_message(
            namespace="/invalidation",
            message="data-invalidated",
            data={["parlays", parlay.match_user_id]},
        )
        send_socket_message(
            namespace="/invalidation",
            message="data-invalidated",
            data={["matches", parlay.match_user.match_id]},
        )

    asyncio.run(send_updates())


def listen_for_parlay_pick_updated():
    """Function that listens for a parlay_pick_updated message on redis"""
    session = get_db_session()

    def handle_pick_updated(data):
        """Handles incoming parlay_pick_updated messages"""
        pick_id = data.get("id")
        if not pick_id:
            logger.error("⚠️ Received parlay_pick_updated message without id")
            return

        update_parlay(session, pick_id)

    logger.info("🔄 Listening for parlay_pick_updated messages...")
    listen_for_messages("parlay_pick_updated", handle_pick_updated)


def main():
    """Main function that listens for parlay_pick_updated messages."""
    try:
        listen_for_parlay_pick_updated()
    except KeyboardInterrupt:
        logger.warning("🛑 Shutting down update_parlays...")
    except Exception as e:
        logger.error(f"⚠️ Error in main: {e}")


if __name__ == "__main__":
    main()
