import os

from dotenv import load_dotenv

load_dotenv()

bias = float(os.getenv("BIAS"))

redis_host = os.getenv("REDIS_HOST")
redis_port = int(os.getenv("REDIS_PORT"))
redis_db = int(os.getenv("REDIS_DB"))
