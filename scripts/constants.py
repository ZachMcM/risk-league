from typing import TypedDict
from dotenv import load_dotenv
import os

load_dotenv()

req_pause_time = os.getenv("REQ_PAUSE_TIME") 
minutes_threshold = os.getenv("MINUTES_THRESHOLD") 
n_games = os.getenv("N_GAMES")
sigma_coeff = os.getenv("SIGMA_COEFF")

class ConstantSet(TypedDict):
    standard: float
    fallback: float


class StatConstants(TypedDict):
    pts: ConstantSet
    reb: ConstantSet
    ast: ConstantSet
    three_pm: ConstantSet
    blk: ConstantSet
    stl: ConstantSet
    tov: ConstantSet
    pra: ConstantSet
    reb_ast: ConstantSet
    pts_ast: ConstantSet


import os

StatConstants = {
    "pts": {
        "standard": float(os.getenv("PTS_STANDARD", 2)),
        "fallback": float(os.getenv("PTS_FALLBACK", -0.5)),
    },
    "reb": {
        "standard": float(os.getenv("REB_STANDARD", 1.5)),
        "fallback": float(os.getenv("REB_FALLBACK", -0.4)),
    },
    "ast": {
        "standard": float(os.getenv("AST_STANDARD", 1)),
        "fallback": float(os.getenv("AST_FALLBACK", -0.3)),
    },
    "three_pm": {
        "standard": float(os.getenv("THREE_PM_STANDARD", 1)),
        "fallback": float(os.getenv("THREE_PM_FALLBACK", -0.2)),
    },
    "blk": {
        "standard": float(os.getenv("BLK_STANDARD", 0.5)),
        "fallback": float(os.getenv("BLK_FALLBACK", -0.2)),
    },
    "stl": {
        "standard": float(os.getenv("STL_STANDARD", 0.5)),
        "fallback": float(os.getenv("STL_FALLBACK", -0.2)),
    },
    "tov": {
        "standard": float(os.getenv("TOV_STANDARD", 0.7)),
        "fallback": float(os.getenv("TOV_FALLBACK", -0.3)),
    },
    "pra": {
        "standard": float(os.getenv("PRA_STANDARD", 4)),
        "fallback": float(os.getenv("PRA_FALLBACK", -1.5)),
    },
    "pts_ast": {
        "standard": float(os.getenv("PTS_AST_STANDARD", 3)),
        "fallback": float(os.getenv("PTS_AST_FALLBACK", -0.8)),
    },
    "reb_ast": {
        "standard": float(os.getenv("REB_AST_STANDARD", 2.5)),
        "fallback": float(os.getenv("REB_AST_FALLBACK", -0.7)),
    },
}
