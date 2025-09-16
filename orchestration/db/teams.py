import psycopg
from typing import TypedDict
from utils import setup_logger
from .connection import get_connection

logger = setup_logger(__name__)

class Team(TypedDict):
    """Team from API response"""
    team_id: int
    league: str
    full_name: str
    abbreviation: str
    location: str
    mascot: str
    arena: str
    conference: str

def insert_teams(teams_data: list[Team]) -> list[int]:
    """
    Insert multiple teams into the database with upsert logic.
    Replicates the functionality of POST /teams from the server route.

    Args:
        teams_data: List of team dicts to insert

    Returns:
        List of inserted team IDs

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                insert_query = """
                    INSERT INTO team (team_id, league, full_name, abbreviation, location, mascot, arena, conference)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (team_id, league)
                    DO UPDATE SET
                        conference = EXCLUDED.conference,
                        abbreviation = EXCLUDED.abbreviation,
                        location = EXCLUDED.location,
                        mascot = EXCLUDED.mascot,
                        arena = EXCLUDED.arena,
                        full_name = EXCLUDED.full_name
                    RETURNING team_id
                """

                team_ids = []
                for team_data in teams_data:
                    cur.execute(insert_query, (
                        team_data['team_id'],
                        team_data['league'],
                        team_data['full_name'],
                        team_data['abbreviation'],
                        team_data['location'],
                        team_data['mascot'],
                        team_data['arena'],
                        team_data['conference']
                    ))
                    result = cur.fetchone()
                    if result:
                        team_ids.append(result[0])

                logger.info(f"Successfully inserted {len(team_ids)} team(s)")
                return team_ids

    except psycopg.Error as e:
        logger.error(f"Database error inserting teams: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error inserting teams: {e}")
        raise

def get_teams_by_league(league: str) -> list[Team]:
    """
    Get all teams for a league.
    Replicates GET /teams/league/:league

    Args:
        league: The league to filter by

    Returns:
        List of teams for the league

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT team_id, league, full_name, abbreviation, location, mascot, arena, conference
                    FROM team
                    WHERE league = %s
                    ORDER BY full_name
                """

                cur.execute(query, (league,))
                rows = cur.fetchall()

                teams = []
                for row in rows:
                    team: Team = {
                        'team_id': row[0],
                        'league': row[1],
                        'full_name': row[2],
                        'abbreviation': row[3],
                        'location': row[4],
                        'mascot': row[5],
                        'arena': row[6],
                        'conference': row[7]
                    }
                    teams.append(team)

                logger.info(f"Retrieved {len(teams)} teams for league {league}")
                return teams

    except psycopg.Error as e:
        logger.error(f"Database error getting teams by league: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting teams by league: {e}")
        raise

def update_team_colors(team_id: int, league: str, color: str, alternate_color: str) -> None:
    """
    Update a team's colors.
    Replicates PUT /teams/:id/league/:league/colors functionality.

    Args:
        team_id: The team ID
        league: The league
        color: The primary color
        alternate_color: The alternate color

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                update_query = """
                    UPDATE team
                    SET color = %s, alternate_color = %s
                    WHERE team_id = %s AND league = %s
                """

                cur.execute(update_query, (color, alternate_color, team_id, league))

                if cur.rowcount == 0:
                    logger.warning(f"No team found with ID {team_id} in league {league}")
                else:
                    logger.info(f"Successfully updated colors for team {team_id} in {league}")

    except psycopg.Error as e:
        logger.error(f"Database error updating team colors: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating team colors: {e}")
        raise

def update_team_image(team_id: int, league: str, image_url: str) -> None:
    """
    Update a team's image URL.
    Replicates PUT /teams/:id/league/:league/image functionality.

    Args:
        team_id: The team ID
        league: The league
        image_url: The image URL to set

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                update_query = """
                    UPDATE team
                    SET image = %s
                    WHERE team_id = %s AND league = %s
                """

                cur.execute(update_query, (image_url, team_id, league))

                if cur.rowcount == 0:
                    logger.warning(f"No team found with ID {team_id} in league {league}")
                else:
                    logger.info(f"Successfully updated image for team {team_id} in {league}")

    except psycopg.Error as e:
        logger.error(f"Database error updating team image: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating team image: {e}")
        raise