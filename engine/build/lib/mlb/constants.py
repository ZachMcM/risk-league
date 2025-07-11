import os

from dotenv import load_dotenv

load_dotenv()

N_GAMES = int(os.getenv("MLB_N_GAMES"))
SIGMA_COEFF = float(os.getenv("MLB_SIGMA_COEFF")) 