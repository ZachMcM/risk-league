from typing import TypedDict, Literal
from datetime import datetime


class MetricStats(TypedDict):
    mean: float
    sd: float


Leagues = Literal["nba", "mlb"]
