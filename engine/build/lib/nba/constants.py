import os

from dotenv import load_dotenv

load_dotenv()

REQ_PAUSE_TIME = float(os.getenv("REQ_PAUSE_TIME"))
MINUTES_THRESHOLD = int(os.getenv("MINUTES_THRESHOLD"))
N_GAMES = int(os.getenv("NBA_N_GAMES"))
MIN_NUM_STATS = float(os.getenv("NBA_MIN_NUM_STATS"))
SIGMA_COEFF = float(os.getenv("NBA_SIGMA_COEFF"))
