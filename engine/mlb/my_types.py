from datetime import datetime
from typing import Literal, TypedDict

from shared.my_types import StatName
from shared.tables import Players, MlbPlayerStats


stats_arr: list[str] = [
    "hits",
    "home_runs",
    "doubles",
    "triples",
    "rbi",
    "strikeouts",
    "pitching_hits",
    "pitching_walks",
    "pitches_thrown",
    "earned_runs",
    "pitching_strikeouts",
]

Stat = Literal[
    "pitching_strikeouts",
    "home_runs",
    "doubles",
    "triples",
    "pitching_hits",
    "pitching_walks",
    "rbi",
    "pitches_thrown",
    "hits",
    "strikeouts",
    "earned_runs",
]

stat_name_list: list[StatName] = []


class PlayerData(TypedDict):
    matchup: str
    player: Players
    game_id: str
    last_games: list[MlbPlayerStats]
    game_start_time: datetime
