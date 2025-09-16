from utils import setup_logger, server_req, getenv_required
from redis_utils import listen_for_messages, create_redis_client
import concurrent.futures

logger = setup_logger(__name__)

redis_client = create_redis_client()

PARLAYS_UPDATER_MAX_WORKERS = int(getenv_required("PARLAYS_UPDATER_MAX_WORKERS"))

def handle_pick_resolved(data):
    """Handles incoming pick_resolved messages"""
    pick_id = data.get("id")
    if not pick_id:
        logger.error("Received pick_resolved message without id")
        return

    server_req(route=f"/parlays?pickId={pick_id}", method="PATCH")


def listen_for_pick_resolved():
    """Function that listens for a pick_resolved message on redis"""
    with concurrent.futures.ProcessPoolExecutor(max_workers=PARLAYS_UPDATER_MAX_WORKERS) as executor:

        def async_handler(data):
            executor.submit(handle_pick_resolved, data)

        logger.info("Listening for pick_resolved messages...")
        listen_for_messages(redis_client, "pick_resolved", async_handler)


def main():
    """Main function that listens for pick_resolved messages."""
    try:
        listen_for_pick_resolved()
    except KeyboardInterrupt:
        logger.warning("Shutting down update_parlays...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
