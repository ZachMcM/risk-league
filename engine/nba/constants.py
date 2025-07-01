import os

from dotenv import load_dotenv

load_dotenv()

req_pause_time = float(os.getenv("REQ_PAUSE_TIME"))
minutes_threshold = int(os.getenv("MINUTES_THRESHOLD"))

n_games = int(os.getenv("NBA_N_GAMES"))

secondary_minutes_threshold = float(os.getenv("SECONDARY_MINUTES_THRESHOLD"))

min_num_stats = float(os.getenv("NBA_MIN_NUM_STATS"))
