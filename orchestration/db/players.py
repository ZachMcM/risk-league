import psycopg
from typing import TypedDict
from utils import setup_logger, getenv_required
from .connection import get_connection_context
import requests

logger = setup_logger(__name__)

class InjuryEntry(TypedDict):
    injury: str
    player: str
    status: str
    returns: str
    player_id: str
    date_injured: str

class TeamInjuriesEntry(TypedDict):
    team: str
    team_id: int
    injuries: list[InjuryEntry]

class LeagueInjuries(TypedDict):
    data: dict[str, list[TeamInjuriesEntry]]

class DepthChartPlayer(TypedDict):
    id: int
    player: str

class PositionDepthChart(TypedDict):
    pass

class TeamDepthChart(TypedDict):
    team_id: int

class LeagueDepthCharts(TypedDict):
    pass

def data_feeds_req_with_params(route: str, query_params: dict | None = None) -> dict:
    """Make authenticated GET requests to the data feeds API with query parameters.

    Args:
        route: API route (e.g., '/injuries/NFL')
        query_params: Dictionary of query parameters

    Returns:
        Response JSON data

    Raises:
        requests.HTTPError: If response status is not 200
    """
    DATA_FEEDS_API_TOKEN = getenv_required("DATA_FEEDS_API_TOKEN")
    DATA_FEEDS_BASE_URL = getenv_required("DATA_FEEDS_BASE_URL")

    url = f"{DATA_FEEDS_BASE_URL}{route}"
    params = {"RSC_token": DATA_FEEDS_API_TOKEN}

    if query_params:
        params.update(query_params)

    response = requests.get(url, params=params, timeout=30)

    if response.status_code not in [200, 304]:
        raise requests.HTTPError(
            f"Data feeds request failed: {response.status_code} {response.reason}. Response: {response.text}",
            response=response,
        )

    return response.json()

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

    For college leagues (NCAAFB, NCAABB), returns all active players.
    For professional leagues, filters by injuries and depth chart position.

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
                # First verify the team exists
                cur.execute(
                    "SELECT team_id FROM team WHERE team_id = %s AND league = %s",
                    (team_id, league)
                )
                if not cur.fetchone():
                    logger.warning(f"No team found with ID {team_id} in league {league}")
                    return []

                # For college leagues, just return all active players
                if league in ["NCAAFB", "NCAABB"]:
                    query = """
                        SELECT number, player_id, status, name, team_id, league,
                               position, updated_at, height, weight
                        FROM player
                        WHERE team_id = %s AND league = %s AND status = 'ACT'
                        ORDER BY position, name
                    """
                    cur.execute(query, (team_id, league))
                    rows = cur.fetchall()
                else:
                    # For professional leagues, use injury and depth chart filtering
                    try:
                        # Get injury data
                        league_injuries = data_feeds_req_with_params(
                            f"/injuries/{league}",
                            {"team_id": team_id}
                        )

                        team_injuries = None
                        for team in league_injuries["data"][league]:
                            if team["team_id"] == team_id:
                                team_injuries = team
                                break

                        if not team_injuries:
                            logger.warning(f"No injury data found for team {team_id} in {league}")
                            injuries_ids_list = []
                        else:
                            injuries_ids_list = [int(injury["player_id"]) for injury in team_injuries["injuries"]]

                        # Get depth chart data
                        league_depth_charts = data_feeds_req_with_params(
                            f"/depth-charts/{league}",
                            {"team_id": team_id}
                        )

                        # Extract the team depth chart (first team in response)
                        team_depth_chart = None
                        if league in league_depth_charts:
                            team_names = list(league_depth_charts[league].keys())
                            if team_names:
                                team_depth_chart = league_depth_charts[league][team_names[0]]

                        depth_chart_player_ids = []
                        if team_depth_chart:
                            for position, position_data in team_depth_chart.items():
                                if isinstance(position_data, dict) and "team_id" not in position_data:
                                    if league == "NFL":
                                        # NFL-specific position and depth filtering
                                        for depth, player in position_data.items():
                                            if player and isinstance(player, dict) and "id" in player:
                                                should_include = (
                                                    (position == "QB" and depth == "1") or
                                                    (position in ["WR1", "WR2", "WR3"] and depth == "1") or
                                                    (position == "PK" and depth == "1") or
                                                    (position == "TE" and depth in ["1", "2"]) or
                                                    (position == "RB" and depth in ["1", "2", "3"])
                                                )
                                                if should_include:
                                                    depth_chart_player_ids.append(player["id"])
                                    else:
                                        # For other leagues, include all players
                                        for player in position_data.values():
                                            if player and isinstance(player, dict) and "id" in player:
                                                depth_chart_player_ids.append(player["id"])

                        # Get all players and filter in Python to avoid dynamic SQL issues
                        query = """
                            SELECT number, player_id, status, name, team_id, league,
                                   position, updated_at, height, weight
                            FROM player
                            WHERE team_id = %s AND league = %s
                            ORDER BY position, name
                        """
                        cur.execute(query, (team_id, league))
                        all_rows = cur.fetchall()

                        # Apply filtering in Python
                        filtered_rows = []
                        for row in all_rows:
                            player_id = row[1]
                            position = row[6]

                            # Skip injured players
                            if player_id in injuries_ids_list:
                                continue

                            # Apply depth chart filtering
                            if depth_chart_player_ids:
                                if league == "MLB":
                                    # Include if in depth chart OR is a pitcher
                                    if player_id in depth_chart_player_ids or position == 'P':
                                        filtered_rows.append(row)
                                else:
                                    # Include only if in depth chart
                                    if player_id in depth_chart_player_ids:
                                        filtered_rows.append(row)
                            else:
                                # No depth chart data - for MLB only include pitchers
                                if league == "MLB":
                                    if position == 'P':
                                        filtered_rows.append(row)
                                else:
                                    filtered_rows.append(row)

                        rows = filtered_rows

                    except Exception as api_error:
                        logger.error(f"Error fetching injury/depth chart data: {api_error}")
                        # Fallback to all active players if API fails
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