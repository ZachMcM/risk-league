import json
import logging
import redis
from shared.constants import redis_host, redis_port, redis_pw

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def create_redis_client() -> redis.Redis:
    """Makes a new redis client object"""
    return redis.Redis(host=redis_host, port=redis_port, password=redis_pw if redis_pw else None)


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
