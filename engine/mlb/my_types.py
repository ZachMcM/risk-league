from datetime import datetime
from typing import Literal, TypedDict
from shared.my_types import Player, StatName


stats_arr = [
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


class MlbGame(TypedDict):
    id: str
    team_id: str | None
    game_date: datetime | None
    game_type: str
    venue_id: int | None
    venue_name: str | None
    opponent_team_id: str | None
    is_home: bool
    status: str | None
    runs: int | None
    opponent_runs: int | None
    win_loss: str | None
    hits: int | None
    doubles: int | None
    triples: int | None
    home_runs: int | None
    rbi: int | None
    stolen_bases: int | None
    caught_stealing: int | None
    walks: int | None
    strikeouts: int | None
    left_on_base: int | None
    batting_avg: float | None
    on_base_pct: float | None
    slugging_pct: float | None
    ops: float | None
    at_bats: int | None
    plate_appearances: int | None
    total_bases: int | None
    hit_by_pitch: int | None
    sac_flies: int | None
    sac_bunts: int | None
    innings_pitched: float | None
    earned_runs: int | None
    pitching_hits: int | None
    pitching_home_runs: int | None
    pitching_walks: int | None
    pitching_strikeouts: int | None
    era: float | None
    whip: float | None
    pitches_thrown: int | None
    strikes: int | None
    balls: int | None
    errors: int | None
    assists: int | None
    putouts: int | None
    fielding_chances: int | None
    passed_balls: int | None
    season: str | None
    created_at: datetime | None


class MlbPlayerStats(TypedDict):
    id: str
    player_id: str | None
    game_id: str
    position: str | None
    at_bats: int | None
    runs: int | None
    hits: int | None
    doubles: int | None
    triples: int | None
    home_runs: int | None
    rbi: int | None
    stolen_bases: int | None
    caught_stealing: int | None
    walks: int | None
    strikeouts: int | None
    left_on_base: int | None
    hit_by_pitch: int | None
    sac_flies: int | None
    sac_bunts: int | None
    batting_avg: float | None
    on_base_pct: float | None
    slugging_pct: float | None
    ops: float | None
    innings_pitched: float | None
    pitching_hits: int | None
    pitching_runs: int | None
    earned_runs: int | None
    pitching_walks: int | None
    pitching_strikeouts: int | None
    pitching_home_runs: int | None
    pitches_thrown: int | None
    strikes: int | None
    balls: int | None
    era: float | None
    whip: float | None
    season: str | None
    updated_at: datetime | None


class PlayerData(TypedDict):
    matchup: str
    player: Player
    game_id: str
    last_games: list[MlbPlayerStats]
    game_start_time: datetime
