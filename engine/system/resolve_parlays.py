import asyncio
import logging

from shared.db_session import get_db_session
from shared.pubsub_utils import listen_for_messages
from shared.socket_utils import send_message as send_socket_message
from shared.tables import ParlayPicks, Parlays
from sqlalchemy import select
from sqlalchemy.orm import Session
from system.constants import parlay_multipliers

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def resolve_parlay(session: Session, pick_id: str):
    """Resolves a parlay if all the picks are resolved"""
    pick = session.execute(
        select(ParlayPicks).where(ParlayPicks.id == pick_id)
    ).scalar_one_or_none()
    if pick is None:
        return

    parlay_id = pick.id

    parlay = session.execute(
        select(Parlays).where(Parlays.id == parlay_id)
    ).scalar_one()
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
        multiplier = parlay_multipliers.get(len(picks))
        delta = parlay.stake * multiplier
        match_user.balance += delta
    else:
        parlay.status = "missed"
        delta = parlay.stake

    session.commit()
    asyncio.run(
        send_socket_message(
            namespace="parlay",
            message="parlay-resolved",
            data={
                "delta": delta,
                "status": parlay.status,
            },
            query_params={"parlay_id": parlay_id},
        )
    )


def listen_for_parlay_pick_resolved():
    """Function that listens for a parlay_pick_resolved message on redis"""
    session = get_db_session()

    def handle_pick_resolved(data):
        """Handles incoming parlay_pick_resolved messages"""
        pick_id = data.get("pick_id")
        if not pick_id:
            logger.error("⚠️ Received prop_resolved message without pick_id")
            return

        resolve_parlay(session, pick_id)

    logger.info("🔄 Listening for prop_resolved messages...")
    listen_for_messages("parlay_pick_resolved", handle_pick_resolved)


def main():
    """Main function that listens for resolved prop messages."""
    try:
        listen_for_parlay_pick_resolved()
    except KeyboardInterrupt:
        logger.warning("🛑 Shutting down prop resolver...")
    except Exception as e:
        logger.error(f"⚠️ Error in main: {e}")


if __name__ == "__main__":
    main()
