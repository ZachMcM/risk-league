from datetime import datetime
from typing import Any, Union
from shared.date_utils import get_eastern_datetime


def clean_minutes(min_str: Union[str, Any]) -> int:
    """Clean minute string format and convert to integer.
    
    Args:
        min_str: String in format "MM:SS" or other format
        
    Returns:
        Integer minutes value
    """
    if isinstance(min_str, str) and ":" in min_str:
        mins, _ = min_str.split(":")
        return int(mins)
    return 0


def get_current_season() -> str:
    """Get the current NBA season string.
    
    Returns:
        String in format "YYYY-YY" representing the current season
    """
    now = get_eastern_datetime()
    year = now.year
    month = now.month

    # If it's before August, the season started last year
    if month < 8:  # Covers Jan–Jul (NBA season still in progress or offseason)
        start_year = year - 1
    else:
        start_year = year

    return f"{start_year}-{str(start_year + 1)[-2:]}"


def get_last_season() -> str:
    """Get the last NBA season string.
    
    Returns:
        String in format "YYYY-YY" representing the previous season
    """
    now = get_eastern_datetime()
    year = now.year
    month = now.month

    # If before October, we're still in or just coming out of last season
    if month < 10:
        start_year = year - 1
    else:
        start_year = year

    return f"{start_year - 1}-{str(start_year)[-2:]}"


def remove_decimals_from_string_id(s: str) -> str:
    """Remove decimal points from string IDs.
    
    Args:
        s: String ID that may contain decimal points
        
    Returns:
        String with decimal points removed
    """
    if "." in s:
        s = s.split(".")[0]
    return s


def get_game_type(code: str) -> str:
    """Get game type from NBA API code.
    
    Args:
        code: Three-digit game type code
        
    Returns:
        String representing the game type
    """
    if code == "001":
        return "preseason"
    elif code == "002":
        return "regular_season"
    elif code == "003":
        return "all_star"
    elif code == "004":
        return "playoffs"
    return "unknown"
