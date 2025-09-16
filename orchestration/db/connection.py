from psycopg_pool import ConnectionPool
from utils import getenv_required, setup_logger
import threading
import atexit

logger = setup_logger(__name__)

_pool = None
_pool_lock = threading.Lock()

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