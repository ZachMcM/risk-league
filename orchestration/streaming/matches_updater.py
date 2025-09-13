from utils import setup_logger, server_req, getenv_required
from redis_utils import listen_for_messages, create_redis_client
import concurrent.futures

logger = setup_logger(__name__)

redis_client = create_redis_client()

MATCHES_UPDATER_MAX_WORKERS = int(getenv_required("MATCHES_UPDATER_MAX_WORKERS"))

def handle_parlay_resolved(data):
    """Handles incoming parlay_resolved messages"""
    parlay_id = data.get("id")
    if not parlay_id:
        logger.error("Received parlay_resolved message without id")
        return

    server_req(route=f"/matches?parlayId={parlay_id}", method="PATCH")


def listen_for_parlay_resolved():
    """Function that listens for a parlay_resolved message on redis"""
    with concurrent.futures.ProcessPoolExecutor(max_workers=MATCHES_UPDATER_MAX_WORKERS) as executor:

        def async_handler(data):
            executor.submit(handle_parlay_resolved, data)

        logger.info("Listening for parlay_resolved messages...")
        listen_for_messages(redis_client, "parlay_resolved", async_handler)


def main():
    """Main function that listens for parlay_resolved messages."""
    try:
        listen_for_parlay_resolved()
    except KeyboardInterrupt:
        logger.warning("Shutting down update_parlays...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
