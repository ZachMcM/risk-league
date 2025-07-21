import redis
from shared.constants import REDIS_HOST, REDIS_PORT, REDIS_PW

def create_redis_client() -> redis.Redis:
    """Makes a new redis client object"""
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PW if REDIS_PW else None)