from utils import setup_logger, server_req
from redis_utils import listen_for_messages, create_redis_client

logger = setup_logger(__name__)

redis_client = create_redis_client()

def listen_for_parlay_pick_resolved():
    """Function that listens for a parlay_pick_resolved message on redis"""
    def handle_pick_resolved(data):
        """Handles incoming parlay_pick_resolved messages"""
        pick_id = data.get("id")
        if not pick_id:
            logger.error("Received parlay_pick_resolved message without id")
            return

        server_req(route=f"/parlays?pickId={pick_id}", method="PATCH")

    logger.info("Listening for parlay_pick_resolved messages...")
    listen_for_messages(redis_client, "parlay_pick_resolved", handle_pick_resolved)


def main():
    """Main function that listens for parlay_pick_resolved messages."""
    try:
        listen_for_parlay_pick_resolved()
    except KeyboardInterrupt:
        logger.warning("Shutting down update_parlays...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
