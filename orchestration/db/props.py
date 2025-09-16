import psycopg
from typing import TypedDict, Literal
from utils import setup_logger
from .connection import get_connection

logger = setup_logger(__name__)

class Prop(TypedDict):
    line: float
    stat_name: str
    stat_display_name: str
    player_id: int
    league: str
    game_id: str
    choices: list[str]
    current_value: float | None
    status: Literal["resolved", "did_not_play", "not_resolved"] | None

def insert_prop(prop_data: Prop) -> str:
    """
    Insert a single prop into the database.

    Args:
        prop_data: Prop dict with required fields

    Returns:
        The inserted prop ID

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                insert_query = """
                    INSERT INTO prop (line, stat_name, stat_display_name, player_id, league, game_id, choices, current_value, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """

                cur.execute(insert_query, (
                    prop_data['line'],
                    prop_data['stat_name'],
                    prop_data['stat_display_name'],
                    prop_data['player_id'],
                    prop_data['league'],
                    prop_data['game_id'],
                    prop_data['choices'],
                    prop_data.get('current_value'),
                    prop_data.get('status', 'not_resolved')
                ))

                result = cur.fetchone()
                if not result:
                    raise psycopg.Error("Failed to insert prop - no ID returned")

                prop_id = result[0]
                logger.info(f"Successfully inserted prop: {prop_id}")
                return str(prop_id)

    except psycopg.Error as e:
        logger.error(f"Database error inserting prop: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error inserting prop: {e}")
        raise