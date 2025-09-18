from psycopg_pool import ConnectionPool, AsyncConnectionPool
from utils import getenv_required, setup_logger
import threading
import atexit
import asyncio

logger = setup_logger(__name__)

_pool = None
_pool_lock = threading.Lock()

_async_pool = None
_async_pool_lock = None

def get_pool():
    """Get or create the connection pool (thread-safe singleton)"""
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                database_url = getenv_required("DATABASE_URL")
                _pool = ConnectionPool(
                    database_url,
                    min_size=2,
                    max_size=10,
                    timeout=30.0,
                    max_idle=300.0
                )
                atexit.register(close_pool)
                logger.info("Database connection pool created")
    return _pool

def close_pool():
    """Close the connection pool"""
    global _pool
    if _pool:
        _pool.close()
        _pool = None
        logger.info("Database connection pool closed")

def get_connection():
    """Get a database connection from the pool"""
    return get_pool().connection()

def get_connection_context():
    """Get a connection context manager from the pool"""
    return get_pool().connection()


async def get_async_pool():
    """Get or create the async connection pool (async-safe singleton)"""
    global _async_pool, _async_pool_lock

    if _async_pool is None:
        # Initialize lock if not already done
        if _async_pool_lock is None:
            _async_pool_lock = asyncio.Lock()

        async with _async_pool_lock:
            if _async_pool is None:
                database_url = getenv_required("DATABASE_URL")
                _async_pool = AsyncConnectionPool(
                    database_url,
                    min_size=2,
                    max_size=10,
                    timeout=30.0,
                    max_idle=300.0,
                    open=False
                )
                await _async_pool.open()
                atexit.register(close_async_pool_sync)
                logger.info("Async database connection pool created")
    return _async_pool


def close_async_pool_sync():
    """Close the async connection pool (sync version for atexit)"""
    global _async_pool
    if _async_pool:
        # Create a new event loop if one doesn't exist
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            # If loop is running, schedule the close
            asyncio.create_task(_async_pool.close())
        else:
            # If loop is not running, run the close directly
            loop.run_until_complete(_async_pool.close())

        _async_pool = None
        logger.info("Async database connection pool closed")


async def close_async_pool():
    """Close the async connection pool (async version)"""
    global _async_pool
    if _async_pool:
        await _async_pool.close()
        _async_pool = None
        logger.info("Async database connection pool closed")


async def get_async_connection_context():
    """Get an async connection context manager from the pool"""
    pool = await get_async_pool()
    return pool.connection()