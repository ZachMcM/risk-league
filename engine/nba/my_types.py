from datetime import datetime
from typing import Literal, TypedDict

from shared.my_types import StatName
from shared.tables import Players, NbaPlayerStats


stats_arr: list[str] = [
    "pts",
    "reb",
    "ast",
    "three_pm",
    "blk",
    "stl",
    "tov",
    "pra",
    "reb_ast",
    "pts_ast"
]

Stat = Literal[
    "pts",
    "reb",
    "ast",
    "three_pm",
    "blk",
    "stl",
    "tov",
    "pra",
    "reb_ast",
    "pts_ast",
]
CombinedStat = Literal["pra", "reb_ast", "pts_ast"]


stat_name_list: list[StatName] = [
    {"db_name": "pts", "api_name": "points"},
    {"db_name": "reb", "api_name": "reboundsTotal"},
    {"db_name": "ast", "api_name": "assists"},
    {"db_name": "three_pm", "api_name": "threePointersMade"},
    {"db_name": "blk", "api_name": "blocks"},
    {"db_name": "stl", "api_name": "steals"},
    {"db_name": "tov", "api_name": "turnovers"},
]


class PlayerData(TypedDict):
    matchup: str
    player: Players
    game_id: str
    last_games: list[NbaPlayerStats]
    game_start_time: datetime
