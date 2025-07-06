from datetime import datetime
from typing import TypedDict

from shared.my_types import StatName
from shared.tables import Players, MlbPlayerStats


# Note: stats_arr and Stat Literal types have been replaced by the auto-registration system
# Use get_mlb_stats_list() from mlb.prop_configs_new instead

stat_name_list: list[StatName] = []


class PlayerData(TypedDict):
    matchup: str
    player: Players
    game_id: str
    last_games: list[MlbPlayerStats]
    game_start_time: datetime
