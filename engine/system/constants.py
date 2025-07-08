import os
from dotenv import load_dotenv

load_dotenv()

PARLAY_MULTIPLIERS: dict[int, float] = {
    1: 1.5,
    2: 3,
    3: 5,
    4: 10,
    5: 18,
    6: 30,
    7: 50,
}

K = int(os.getenv("K"))
MIN_BETS_REQ=int(os.getenv("MIN_BETS_REQ"))