import os

from dotenv import load_dotenv

load_dotenv()

n_games = int(os.getenv("MLB_N_GAMES"))
