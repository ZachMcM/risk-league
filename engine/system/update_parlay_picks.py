import asyncio
from shared.utils import setup_logger

from shared.db_session import get_db_session
from shared.redis_pubsub_utils import listen_for_messages, publish_message
from shared.socket_utils import send_message as send_socket_message
from shared.tables import ParlayPicks, Props
from sqlalchemy import select, update
from sqlalchemy.orm import Session


logger = setup_logger(__name__)


def update_parlay_picks(session: Session, prop: Props):
    """Function updates all parlay picks associated with a prop.

    Updates the parlay picks to hit or missed and publishes a
    parlay_pick_updated message if prop is resolved.
    Regardless of prop status sends invalidation message for all
    parlay picks on the server.
    """

    if prop.resolved:
        prop_final_status = "over" if prop.current_value > prop.line else "under"

        # Update picks that match the winning outcome to "hit"
        session.execute(
            update(ParlayPicks)
            .where(ParlayPicks.prop_id == prop.id)
            .where(ParlayPicks.pick == prop_final_status)
            .values(status="hit")
        )

        # Update picks that don't match the winning outcome to "missed"
        session.execute(
            update(ParlayPicks)
            .where(ParlayPicks.prop_id == prop.id)
            .where(ParlayPicks.pick != prop_final_status)
            .values(status="missed")
        )

    if not prop.resolved and prop.current_value > prop.line:
        session.execute(
            update(ParlayPicks)
            .where(ParlayPicks.prop_id == prop.id)
            .where(ParlayPicks.pick == "over")
            .values(status="hit")
        )

    # Get updated picks to send notifications
    picks = (
        session.execute(
            select(ParlayPicks)
            .join(Props, Props.id == ParlayPicks.prop_id)
            .where(Props.id == prop.id)
        )
        .scalars()
        .all()
    )

    async def send_updates():
        for pick in picks:
            if pick.parlay is None:
                return

            if pick.parlay.match_user is None:
                return

            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=[
                    "parlays",
                    pick.parlay.match_user.match_id,
                    pick.parlay.match_user.user_id,
                ],
            )
            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=["parlay", pick.parlay.id],
            )
            if prop.resolved:
                publish_message("parlay_pick_updated", {"id": str(pick.id)})

    # Run the async function
    asyncio.run(send_updates())


def listen_for_prop_updated():
    """Function that listens for a prop updated message on the redis server"""
    session = get_db_session()

    def handle_prop_updated(data):
        """Handle incoming prop_updated messages"""
        prop_id = data.get("id")
        if not prop_id:
            logger.fatal("⚠️ Received prop updated message without id")
            return

        prop = session.execute(
            select(Props).where(Props.id == prop_id)
        ).scalar_one_or_none()

        if prop:
            update_parlay_picks(session, prop)
            logger.info(f"✅ Updated parlay picks for prop {prop_id}")
        else:
            logger.fatal(f"⚠️ Prop with id {prop_id} not found")

    logger.info("🔄 Listening for prop updated messages...")
    listen_for_messages("prop_updated", handle_prop_updated)


def main():
    """Main function that listens for prop updated messages."""
    try:
        listen_for_prop_updated()
    except KeyboardInterrupt:
        logger.warning("🛑 Shutting down update_parlay_picks...")
    except Exception as e:
        logger.error(f"⚠️ Error in main: {e}")


if __name__ == "__main__":
    main()
