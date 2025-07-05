from typing import TypedDict, Literal
from datetime import datetime


class Prop(TypedDict):
    id: str
    line: float
    current_value: float
    raw_game_id: str
    player_id: str
    created_at: datetime
    stat: str
    game_start_time: datetime
    league: str
    resolved: bool
    pick_options: list[str]


class Player(TypedDict):
    id: str
    name: str
    team_id: str
    position: str
    updated_at: datetime
    height: str
    weight: int
    number: int


class Team(TypedDict):
    id: str
    full_name: str
    abbreviation: str
    nickname: str
    city: str
    state: str
    year_founded: int


class StatName(TypedDict):
    dbname: str
    api_name: str


class MetricStats(TypedDict):
    mean: float
    sd: float


Leagues = Literal["nba", "mlb"]
