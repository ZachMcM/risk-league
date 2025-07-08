import asyncio
import logging

from shared.db_session import get_db_session
from shared.pubsub_utils import listen_for_messages, publish_message
from shared.socket_utils import send_message as send_socket_message
from shared.tables import ParlayPicks, Props
from sqlalchemy import select, update
from sqlalchemy.orm import Session


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def resolve_parlay_picks(session: Session, prop: Props):
    """Function resolves all parlay picks associated with a prop.

    Updates the parlay picks to hit or missed.
    Then Sends a message to the server websocket.
    Then finally publishes a prop finished message.
    """
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

    # Get updated picks to send notifications
    picks = session.execute(
        select(ParlayPicks.id, Props.current_value, ParlayPicks.status)
        .join(Props, Props.id == ParlayPicks.prop_id)
        .where(Props.id == prop.id)
    ).all()

    async def send_updates():
        for pick_id, current_value, status in picks:
            publish_message("parlay_pick_resolved", {"pick_id": str(pick_id)})
            await send_socket_message(
                namespace="/parlay_pick",
                message="pick-updated",
                data={
                    "current_value": current_value,
                    "status": status,
                },
                query_params={"parlay_pick_id": pick_id},
            )

    # Run the async function
    asyncio.run(send_updates())


def listen_for_prop_resolved():
    """Function that listens for a prop resolved message on the redis server"""
    session = get_db_session()

    def handle_prop_resolved(data):
        """Handle incoming prop_resolved messages"""
        prop_id = data.get("prop_id")
        if not prop_id:
            logger.fatal("⚠️ Received prop_resolved message without prop_id")
            return

        prop = session.execute(
            select(Props).where(Props.id == prop_id)
        ).scalar_one_or_none()

        if prop:
            resolve_parlay_picks(session, prop)
            logger.info(f"✅ Resolved parlay picks for prop {prop_id}")
        else:
            logger.fatal(f"⚠️ Prop with id {prop_id} not found")

    logger.info("🔄 Listening for prop_resolved messages...")
    listen_for_messages("prop_resolved", handle_prop_resolved)


def main():
    """Main function that listens for resolved prop messages."""
    try:
        listen_for_prop_resolved()
    except KeyboardInterrupt:
        logger.warning("🛑 Shutting down prop resolver...")
    except Exception as e:
        logger.error(f"⚠️ Error in main: {e}")


if __name__ == "__main__":
    main()
