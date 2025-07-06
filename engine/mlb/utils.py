from typing import Literal

from mlb.my_types import Stat


def get_stat_type(stat: Stat) -> Literal["batting", "pitching"]:
    """Determine if a stat is batting or pitching related.
    
    Args:
        stat: The stat to classify
        
    Returns:
        "batting" or "pitching" depending on the stat type
    """
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


def is_low_volume_stat(stat: Stat) -> bool:
    """Determine if a stat is typically low volume.
    
    Args:
        stat: The stat to check
        
    Returns:
        True if the stat is typically low volume, False otherwise
    """
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