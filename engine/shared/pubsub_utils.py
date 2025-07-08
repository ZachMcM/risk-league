import json
from shared.utils import setup_logger
import redis
from shared.constants import REDIS_HOST, REDIS_PORT, REDIS_PW

logger = setup_logger(__name__)


def create_redis_client() -> redis.Redis:
    """Makes a new redis client object"""
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PW if REDIS_PW else None)


def publish_message(message: str, message_data: dict):
    """Publishes a message to Redis."""
    redis_client = create_redis_client()
    redis_client.publish(message, json.dumps(message_data))


def listen_for_messages(channel: str, callback):
    """Listen for messages on a Redis channel and call callback function."""
    redis_client = create_redis_client()
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel)

    for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"])
                callback(data)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing message: {e}")
