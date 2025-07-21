from shared.utils import setup_logger
import statsapi
from nba_api.live.nba.endpoints import ScoreBoard
import sys
from typing import Any
from shared.date_utils import get_today_eastern, get_yesterday_eastern

logger = setup_logger(__name__)


def get_today_nba_games():
    """Get all NBA games for today from the API.

    Returns:
        List of today's NBA games
    """
    today = get_today_eastern()
    try:
        scoreboard = ScoreBoard()
        games = ScoreBoard().games.get_dict()
        if scoreboard.score_board_date != today:
            logger.warning("No games found currently")
        return games
    except Exception as e:
        logger.error(f"Error fetching today's games: {e}")
        sys.exit(1)


def get_today_mlb_games() -> list[dict[str, Any]]:
    """Get all MLB games for today.

    Returns:
        List of today's MLB games from the API
    """
    today = get_today_eastern()
    try:
        schedule = statsapi.schedule(start_date=today, end_date=today)
        if not schedule:
            logger.warning("No games found today, no props to sync!")
        return schedule
    except Exception as e:
        logger.error(f"Error fetching today's games: {e}")
        sys.exit(1)    


def get_yesterday_nba_games():
    """Get all NBA games for yesterday from the API.

    Returns:
        List of yesterday's NBA games
    """
    yesterday = get_yesterday_eastern()
    try:
        scoreboard = ScoreBoard(game_date=yesterday)
        games = scoreboard.games.get_dict()
        return games
    except Exception as e:
        logger.error(f"Error fetching yesterday's NBA games: {e}")
        return []


def get_yesterday_mlb_games() -> list[dict[str, Any]]:
    """Get all MLB games for yesterday.

    Returns:
        List of yesterday's MLB games from the API
    """
    yesterday = get_yesterday_eastern()
    try:
        schedule = statsapi.schedule(start_date=yesterday, end_date=yesterday)
        return schedule
    except Exception as e:
        logger.error(f"Error fetching yesterday's MLB games: {e}")
        return []
    