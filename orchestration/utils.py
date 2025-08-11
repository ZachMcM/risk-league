import os

from dotenv import load_dotenv

load_dotenv()


def getenv_required(key: str) -> str:
    value = os.getenv(key)
    if value is None:
        raise ValueError(f"Required environment variable {key} is not set")
    return value
