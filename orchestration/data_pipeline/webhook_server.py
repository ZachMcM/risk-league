from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from redis_utils import create_async_redis_client, publish_message_async
from utils import getenv_required, setup_logger

logger = setup_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    logger.info(f"Setting up FastAPI on port {getenv_required('PORT')}")
    yield
    # Shutdown
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()


# Create app with lifespan
app = FastAPI(lifespan=lifespan)

# Global async Redis client
_redis_client = None


async def get_redis_client():
    """Get or create async Redis client"""
    global _redis_client
    if _redis_client is None:
        _redis_client = await create_async_redis_client()
    return _redis_client


def api_key_or_ip_middleware(request: Request):
    """Middleware to check API key or IP address authorization"""
    api_key = request.headers.get("x-api-key")

    # Get client IP from x-forwarded-for or direct connection
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None

    expected_api_key = getenv_required("API_KEY")
    allowed_ip = getenv_required("DATA_FEEDS_PUSH_IP_ADDRESS")

    if api_key != expected_api_key and client_ip != allowed_ip:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.post("/webhook/stats/league/{league_id}")
async def handle_webhook(
    league_id: str, request: Request, _: None = Depends(api_key_or_ip_middleware)
):
    """Handle stats webhook with proper async Redis publishing"""
    logger.info(f"Stat update request for league: {league_id}", request)
    if league_id not in ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"]:
        raise HTTPException(status_code=400, detail="Invalid league_id")

    # Use async Redis client
    redis_client = await get_redis_client()
    await publish_message_async(redis_client, "stats_updated", {"league": league_id})

    return {"success": True}
