import os

from dotenv import load_dotenv

load_dotenv()

N_GAMES = int(os.getenv("MLB_N_GAMES"))
ABS_SIGMA_COEFF = float(os.getenv("ABS_SIGMA_COEFF")) 
