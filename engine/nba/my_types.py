from datetime import datetime
from typing import Literal, TypedDict
from shared.my_types import Player, StatName

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


class NbaGame(TypedDict):
    id: str
    team_id: str
    pts: int
    game_date: datetime
    wl: str
    matchup: str
    min: int
    fgm: int
    fga: int
    fta: int
    ftm: int
    three_pa: int
    three_pm: int
    oreb: int
    dreb: int
    reb: int
    ast: int
    stl: int
    blk: int
    tov: int
    pf: int
    plus_minus: int
    game_type: str
    season: str
    pace: float
    tov_ratio: float
    tov_pct: float
    off_rating: float
    def_rating: float


class NbaPlayerStats(TypedDict):
    id: str
    player_id: str
    game_id: str
    pts: int
    min: int
    fgm: int
    fga: int
    fta: int
    ftm: int
    three_pa: int
    three_pm: int
    oreb: int
    dreb: int
    reb: int
    ast: int
    stl: int
    blk: int
    tov: int
    pf: int
    plus_minus: int
    updated_at: datetime
    season: str
    true_shooting: float
    usage_rate: float
    reb_pct: float
    dreb_pct: float
    oreb_pct: float
    ast_pct: float
    ast_ratio: float
    tov_ratio: float


class PlayerData(TypedDict):
    matchup: str
    player: Player
    game_id: str
    last_games: list[NbaPlayerStats]
    game_start_time: datetime
