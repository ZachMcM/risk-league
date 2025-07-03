import os

from dotenv import load_dotenv

load_dotenv()

n_games = int(os.getenv("MLB_N_GAMES"))
min_num_stats = int(os.getenv("MLB_MIN_NUM_STATS"))
sigma_coeff = float(os.getenv("MLB_SIGMA_COEFF"))