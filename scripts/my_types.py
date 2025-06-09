from typing import TypedDict, Literal
from datetime import datetime


class MetricStats(TypedDict):
    mean: float
    sd: float


StatType = Literal[
    "pts",
    "reb",
    "ast",
    "three_pm",
    "blk",
    "stl",
    "tov",
    "pra",
    "fantasy_score",
    "reb_ast",
    "pts_ast",
]
CombinedStatType = Literal["pra", "reb_ast", "pts_ast"]


class NbaPlayer(TypedDict):
    id: str
    name: str
    team_id: str
    position: str
    updated_at: datetime
    height: str
    weight: int
    number: int


class NbaTeam(TypedDict):
    id: str
    full_name: str
    abbreviation: str
    nickname: str
    city: str
    state: str
    year_founded: int


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
    
class NbaProp(TypedDict):
    id: str
    stat_type: str
    player_id: str
    raw_game_id: str
    line: float
    current_value: float
    created_at: datetime
    game_start_time: datetime

class PlayerData(TypedDict):
    matchup: str
    player: NbaPlayer
    game_id: str
    last_games: list[NbaPlayerStats]
    game_start_time: datetime
