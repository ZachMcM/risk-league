from shared.redis import create_redis_client
import json


def cacheValue(key: str, value: dict):
    """Caches a value

    Args:
        key: The key for the data in the cache
        value: The value of the data in the cache
    """
    redis_client = create_redis_client()
    redis_client.set(key, json.dumps(value))


def retrieveCachedValue(key: str) -> dict:
    """Retrieves a cached value

    Args:
        key: The key of value to retrieve
    """
    redis_client = create_redis_client()
    value = redis_client.get(key)
    return json.loads(value)
