from datetime import datetime
from typing import Literal, TypedDict

from shared.my_types import StatName
from shared.tables import Players, NbaPlayerStats


# Note: stats_arr and Stat Literal types have been replaced by the auto-registration system
# Use get_nba_stats_list() from nba.prop_configs_new instead
CombinedStat = Literal["pra", "reb_ast", "pts_ast"]

class PlayerData(TypedDict):
    matchup: str
    player: Players
    game_id: str
    last_games: list[NbaPlayerStats]
    game_start_time: datetime
