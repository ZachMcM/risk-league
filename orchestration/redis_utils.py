import json
import asyncio

import redis
import redis.asyncio as redis_async
from utils import getenv_required, setup_logger

REDIS_HOST = getenv_required("REDIS_HOST")
REDIS_PORT = int(getenv_required("REDIS_PORT"))
REDIS_PW = getenv_required("REDIS_PW")


def create_redis_client() -> redis.Redis:
    """Makes a new redis client object"""
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PW)


async def create_async_redis_client() -> redis_async.Redis:
    """Makes a new async redis client object"""
    return redis_async.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PW,
        decode_responses=True
    )


logger = setup_logger(__name__)


def publish_message(redis_client: redis.Redis, channel: str, message_data: dict):
    """Publishes a message to Redis.

    Args:
        channel: The channel to publish the message
        message_data: The actual message data being passed
    """
    redis_client.publish(channel, json.dumps(message_data))


def listen_for_messages(redis_client: redis.Redis, channel: str, callback):
    """Listen for messages on a Redis channel and call callback function.

    Args:
        channel: The channel to listen for messages
        callback: Function to be called on a message found
    """
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel)

    for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"])
                callback(data)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing message: {e}")


async def publish_message_async(redis_client: redis_async.Redis, channel: str, message_data: dict):
    """Publishes a message to Redis asynchronously.

    Args:
        redis_client: Async Redis client
        channel: The channel to publish the message
        message_data: The actual message data being passed
    """
    await redis_client.publish(channel, json.dumps(message_data))


async def listen_for_messages_async(redis_client: redis_async.Redis, channel: str, callback):
    """Listen for messages on a Redis channel and call async callback function.

    Args:
        redis_client: Async Redis client
        channel: The channel to listen for messages
        callback: Async function to be called on a message found
    """
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel)

    # Task monitoring counters
    active_tasks = 0
    total_messages = 0
    last_log_time = asyncio.get_event_loop().time()

    def task_done_callback(task):
        nonlocal active_tasks
        active_tasks -= 1

        # Log any task exceptions
        if task.exception():
            logger.error(f"Task failed: {task.exception()}")

    async for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"]) if isinstance(message["data"], str) else message["data"]

                # Create task with monitoring
                task = asyncio.create_task(callback(data))
                task.add_done_callback(task_done_callback)

                active_tasks += 1
                total_messages += 1

                # Log stats every 100 messages or 60 seconds
                current_time = asyncio.get_event_loop().time()
                if total_messages % 100 == 0 or (current_time - last_log_time) > 60:
                    logger.info(f"[{channel}] Active tasks: {active_tasks}, Total processed: {total_messages}")
                    last_log_time = current_time

                    # Warn if tasks are piling up (might indicate downstream issues)
                    if active_tasks > 500:
                        logger.warning(f"[{channel}] High task count: {active_tasks} - check downstream performance")

            except json.JSONDecodeError as e:
                logger.error(f"Error parsing message: {e}")
            except Exception as e:
                logger.error(f"Error in message callback: {e}")
