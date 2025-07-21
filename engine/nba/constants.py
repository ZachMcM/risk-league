import os

from dotenv import load_dotenv

load_dotenv()

REQ_PAUSE_TIME = float(os.getenv("REQ_PAUSE_TIME"))
N_GAMES = int(os.getenv("NBA_N_GAMES"))
MPG_SIMGA_COEFF = float(os.getenv("NBA_MPG_SIMGA_COEFF"))
