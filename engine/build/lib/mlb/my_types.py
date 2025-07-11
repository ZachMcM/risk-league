from datetime import datetime
from typing import TypedDict

from shared.tables import Players, MlbPlayerStats


class PlayerData(TypedDict):
    matchup: str
    player: Players
    game_id: str
    last_games: list[MlbPlayerStats]
    game_start_time: datetime
