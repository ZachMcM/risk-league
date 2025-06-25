from datetime import datetime, timezone


def clean_minutes(min_str):
    if isinstance(min_str, str) and ":" in min_str:
        mins, _ = min_str.split(":")
        return int(mins)
    return 0


def get_current_season():
    now = datetime.now()
    year = now.year
    month = now.month

    # If it's before August, the season started last year
    if month < 8:  # Covers Jan–Jul (NBA season still in progress or offseason)
        start_year = year - 1
    else:
        start_year = year

    return f"{start_year}-{str(start_year + 1)[-2:]}"

def get_last_season():
    now = datetime.now()
    year = now.year
    month = now.month

    # If before October, we're still in or just coming out of last season
    if month < 10:
        start_year = year - 1
    else:
        start_year = year

    return f"{start_year - 1}-{str(start_year)[-2:]}"


def remove_decimals_from_string_id(s):
    if "." in s:
        s = s.split(".")[0]
    return s


def get_game_type(code):
    if code == "001":
        return "preseason"
    elif code == "002":
        return "regular_season"
    elif code == "003":
        return "all_star"
    elif code == "004":
        return "playoffs"
    
    
def get_season_bounds(season_str: str):
    start_year, end_year = map(int, season_str.split("-"))
    season_start = datetime(start_year, 10, 1, tzinfo=timezone.utc)
    season_end = datetime(end_year, 6, 30, 23, 59, 59, tzinfo=timezone.utc)
    return season_start, season_end

