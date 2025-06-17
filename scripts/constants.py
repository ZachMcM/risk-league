from typing import TypedDict
from dotenv import load_dotenv
import os

load_dotenv()

req_pause_time = float(os.getenv("REQ_PAUSE_TIME"))
minutes_threshold = int(os.getenv("MINUTES_THRESHOLD"))
n_games = int(os.getenv("N_GAMES"))