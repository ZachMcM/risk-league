from my_types import Stat
from typing import Literal


def get_stat_type(stat: Stat) -> Literal["batting", "pitching"]:
    if (
        stat == "doubles"
        or stat == "triples"
        or stat == "hits"
        or stat == "home_runs"
        or stat == "rbi"
        or stat == "runs"
        or stat == "stolen_bases"
        or stat == "walks"
        or stat == "strikeouts"
    ):
        return "batting"
    else:
        return "pitching"


def is_low_volume_stat(stat: Stat):
    if (
        stat == "home_runs"
        or stat == "triples"
        or stat == "doubles"
        or stat == "stolen_bases"
        or stat == "rbi"
        or stat == "runs"
        or stat == "walks"
        or stat == "strikeouts"
    ):
        return True
    else:
        return False