import psycopg
from typing import TypedDict
from utils import setup_logger
from .connection import get_connection_context

logger = setup_logger(__name__)

class Player(TypedDict):
    number: int | None
    player_id: int
    status: str
    name: str
    team_id: int
    league: str
    position: str
    updated_at: str
    height: str | None
    weight: int | None

def insert_players(players_data: list[Player]) -> list[int]:
    """
    Insert multiple players into the database with upsert logic.
    Replicates the functionality of POST /players from the server route.

    Args:
        players_data: List of player dicts to insert

    Returns:
        List of inserted player IDs

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection_context() as conn:
            with conn.cursor() as cur:
                # First, get all valid team IDs for the league in one query
                if not players_data:
                    return []

                league = players_data[0]['league']  # All players should be from same league
                team_ids = list(set(p['team_id'] for p in players_data))

                cur.execute(
                    "SELECT team_id FROM team WHERE team_id = ANY(%s) AND league = %s",
                    (team_ids, league)
                )
                valid_team_ids = {row[0] for row in cur.fetchall()}

                # Filter players that have valid team references
                valid_players = []
                for player_data in players_data:
                    if player_data['team_id'] in valid_team_ids:
                        valid_players.append(player_data)
                    else:
                        logger.warning(
                            f"Skipping player {player_data['name']} - team {player_data['team_id']} not found in league {player_data['league']}"
                        )

                if not valid_players:
                    logger.info("No players with valid team references")
                    return []

                # Insert valid players with upsert logic
                insert_query = """
                    INSERT INTO player (player_id, name, team_id, position, number, height, weight, status, league, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (player_id, league)
                    DO UPDATE SET
                        team_id = EXCLUDED.team_id,
                        position = EXCLUDED.position,
                        updated_at = EXCLUDED.updated_at,
                        status = EXCLUDED.status,
                        number = EXCLUDED.number,
                        height = EXCLUDED.height,
                        weight = EXCLUDED.weight,
                        name = EXCLUDED.name
                    RETURNING player_id
                """

                # Execute batch insert using executemany
                player_values = []
                for player_data in valid_players:
                    player_values.append((
                        player_data['player_id'],
                        player_data['name'],
                        player_data['team_id'],
                        player_data['position'],
                        player_data['number'],
                        player_data['height'],
                        player_data['weight'],
                        player_data['status'],
                        player_data['league']
                    ))

                player_ids = []
                for values in player_values:
                    cur.execute(insert_query, values)
                    result = cur.fetchone()
                    if result:
                        player_ids.append(result[0])

                logger.info(
                    f"Successfully inserted {len(player_ids)} player(s), skipped {len(players_data) - len(valid_players)} player(s) with missing team references"
                )
                return player_ids

    except psycopg.Error as e:
        logger.error(f"Database error inserting players: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error inserting players: {e}")
        raise

def get_active_players_for_team(league: str, team_id: int) -> list[Player]:
    """
    Get all active players for a team in a specific league.

    This function replicates the logic from /players/league/:league/team/:teamId/active
    but without the injury and depth chart filtering for simplicity.
    For college leagues (NCAAFB, NCAABB), returns all active players.
    For professional leagues, returns all active players (injury/depth chart filtering
    would require additional API calls and complexity).

    Args:
        league: The league to filter by
        team_id: The team ID to filter by

    Returns:
        List of active players for the team

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection_context() as conn:
            with conn.cursor() as cur:
                # For now, return all active players for the team
                # The original route does injury/depth chart filtering but that requires
                # external API calls which we're trying to avoid
                query = """
                    SELECT number, player_id, status, name, team_id, league,
                           position, updated_at, height, weight
                    FROM player
                    WHERE team_id = %s AND league = %s AND status = 'ACT'
                    ORDER BY position, name
                """

                cur.execute(query, (team_id, league))
                rows = cur.fetchall()

                players = []
                for row in rows:
                    player: Player = {
                        'number': row[0],
                        'player_id': row[1],
                        'status': row[2],
                        'name': row[3],
                        'team_id': row[4],
                        'league': row[5],
                        'position': row[6],
                        'updated_at': row[7],
                        'height': row[8],
                        'weight': row[9]
                    }
                    players.append(player)

                logger.info(f"Retrieved {len(players)} active players for team {team_id} in {league}")
                return players

    except psycopg.Error as e:
        logger.error(f"Database error getting active players: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting active players: {e}")
        raise

def get_players_by_league(league: str) -> list[Player]:
    """
    Get all active players for a league.
    Replicates GET /players/league/:league/active

    Args:
        league: The league to filter by

    Returns:
        List of active players for the league

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection_context() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT number, player_id, status, name, team_id, league,
                           position, updated_at, height, weight
                    FROM player
                    WHERE league = %s AND status = 'ACT'
                    ORDER BY name
                """

                cur.execute(query, (league,))
                rows = cur.fetchall()

                players = []
                for row in rows:
                    player: Player = {
                        'number': row[0],
                        'player_id': row[1],
                        'status': row[2],
                        'name': row[3],
                        'team_id': row[4],
                        'league': row[5],
                        'position': row[6],
                        'updated_at': row[7],
                        'height': row[8],
                        'weight': row[9]
                    }
                    players.append(player)

                logger.info(f"Retrieved {len(players)} active players for league {league}")
                return players

    except psycopg.Error as e:
        logger.error(f"Database error getting players by league: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting players by league: {e}")
        raise

def update_player_image(player_id: int, league: str, image_url: str) -> None:
    """
    Update a player's image URL.
    Replicates PUT /players/:id/league/:league/image functionality.

    Args:
        player_id: The player ID
        league: The league
        image_url: The image URL to set

    Raises:
        psycopg.Error: If database operation fails
    """
    try:
        with get_connection_context() as conn:
            with conn.cursor() as cur:
                update_query = """
                    UPDATE player
                    SET image = %s
                    WHERE player_id = %s AND league = %s
                """

                cur.execute(update_query, (image_url, player_id, league))

                if cur.rowcount == 0:
                    logger.warning(f"No player found with ID {player_id} in league {league}")
                else:
                    logger.info(f"Successfully updated image for player {player_id} in {league}")

    except psycopg.Error as e:
        logger.error(f"Database error updating player image: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating player image: {e}")
        raise