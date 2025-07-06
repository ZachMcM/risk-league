import statsapi
from nba_api.live.nba.endpoints import ScoreBoard
import sys
from datetime import datetime
from typing import Any


def get_today_nba_games():
    """Get all NBA games for today from the API.

    Returns:
        List of today's NBA games
    """
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        scoreboard = ScoreBoard()
        games = ScoreBoard().games.get_dict()
        if scoreboard.score_board_date != today:
            print("⚠️ No games found today, no props to generate!")
        return games
    except Exception as e:
        print(f"⚠️ Error fetching today's games: {e}")
        sys.exit(1)


def get_today_mlb_games() -> list[dict[str, Any]]:
    """Get all MLB games for today.

    Returns:
        List of today's MLB games from the API
    """
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        schedule = statsapi.schedule(start_date=today, end_date=today)
        if not schedule:
            print("⚠️ No games found today, no props to sync!")
        return schedule
    except Exception as e:
        print(f"⚠️ Error fetching today's games: {e}")
        sys.exit(1)
