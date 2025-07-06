import os

from dotenv import load_dotenv

load_dotenv()

bias = float(os.getenv("BIAS"))

parlay_multipliers = {
    1: 1.5,
    2: 3,
    3: 5,
    4: 10,
    5: 18,
    6: 30,
    7: 50,
}
