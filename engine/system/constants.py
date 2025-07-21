import os
from dotenv import load_dotenv

load_dotenv()

K = int(os.getenv("K"))
MIN_BETS_REQ=int(os.getenv("MIN_BETS_REQ"))