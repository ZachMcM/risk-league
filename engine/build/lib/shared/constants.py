import os

from dotenv import load_dotenv

load_dotenv()

BIAS = float(os.getenv("BIAS"))

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))
REDIS_PW = os.getenv("REDIS_PW")