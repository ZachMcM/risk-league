import psycopg
from typing import TypedDict
from utils import setup_logger
from .connection import get_connection_context

logger = setup_logger(__name__)

class Game(TypedDict):
  game_id: str
  start_time: str
  home_team_id: int
  away_team_id: int
  league: str
  

def insert_game(game_data: Game):
    """
    Insert a single game into the database with upsert logic.

    Args:
        game_data: Game dict with: game_id, startTime, homeTeamId, awayTeamId, league

    Returns:
        The inserted game ID

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection_context() as conn:
            with conn.cursor() as cur:
                # Build the INSERT query with ON CONFLICT DO UPDATE
                insert_query = """
                    INSERT INTO game (game_id, start_time, home_team_id, away_team_id, league)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (game_id, league)
                    DO UPDATE SET game_id = EXCLUDED.game_id
                    RETURNING game_id
                """

                # Execute single insert
                cur.execute(insert_query, (
                    game_data['game_id'],
                    game_data['start_time'],
                    game_data['home_team_id'],
                    game_data['away_team_id'],
                    game_data["league"]
                ))

                # Fetch the returned game ID
                result = cur.fetchone()
                game_id = result[0] if result else None

                logger.info(f"Successfully inserted game: {game_id}")

    except psycopg.Error as e:
        logger.error(f"Database error inserting game: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error inserting game: {e}")
        raise