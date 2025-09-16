import json
from utils import getenv_required
from fastapi import FastAPI, HTTPException, Request, Depends
from redis_utils import create_redis_client

app = FastAPI()

redis_client = create_redis_client()


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
async def handle_webhook(league_id: str, request: Request, _: None = Depends(api_key_or_ip_middleware)):
    if league_id not in ["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"]:
        raise HTTPException(status_code=400, detail="Invalid league_id")

    redis_client.publish(
        channel="stats_updated", message=json.dumps({"league": league_id})
    )

    return {"success": True}
