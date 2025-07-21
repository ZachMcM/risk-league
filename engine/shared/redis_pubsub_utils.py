import json
from shared.utils import setup_logger
from shared.redis import create_redis_client

logger = setup_logger(__name__)


def publish_message(channel: str, message_data: dict):
    """Publishes a message to Redis.
    
    Args:
        channel: The channel to publish the message
        message_data: The actual message data being passed
    """
    redis_client = create_redis_client()
    redis_client.publish(channel, json.dumps(message_data))


def listen_for_messages(channel: str, callback):
    """Listen for messages on a Redis channel and call callback function.
    
    Args:
        channel: The channel to listen for messages
        callback: Function to be called on a message found
    """
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
