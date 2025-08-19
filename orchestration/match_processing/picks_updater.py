from utils import setup_logger, server_req
from redis_utils import listen_for_messages, create_redis_client
 
logger = setup_logger(__name__)

redis_client = create_redis_client()

def listen_for_prop_updated():
    """Function that listens for a prop updated message on the redis server"""
    def handle_prop_updated(data):
        """Handle incoming prop_updated messages"""
        prop_id = data.get("id")
        if not prop_id:
            logger.error("Received prop updated message without id")
            return
        
        server_req(route=f"/picks?propId={prop_id}", method="PATCH")

    logger.info("Listening for prop updated messages...")
    listen_for_messages(redis_client, "prop_updated", handle_prop_updated)


def main():
    """Main function that listens for prop updated messages."""
    try:
        listen_for_prop_updated()
    except KeyboardInterrupt:
        logger.warning("Shutting down update_parlay_picks...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
