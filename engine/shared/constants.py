import os

from dotenv import load_dotenv

load_dotenv()

bias = float(os.getenv("BIAS"))

redis_host = os.getenv("REDIS_HOST")
redis_port = int(os.getenv("REDIS_PORT"))
redis_db = int(os.getenv("REDIS_DB"))

parlay_multipliers: dict[int, float] = {
    1: 1.5,
    2: 3,
    3: 5,
    4: 10,
    5: 18,
    6: 30,
    7: 50,
}
