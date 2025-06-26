from typing import TypedDict
from datetime import datetime

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