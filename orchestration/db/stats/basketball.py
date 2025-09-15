from typing import TypedDict, List, Optional, Union, cast, Literal
from psycopg.rows import dict_row
from psycopg import sql
import logging
from db.connection import get_connection

logger = logging.getLogger(__name__)

class LeagueAverages(TypedDict):
    """League averages response"""
    stat: str
    average: float
    sample_size: int
    data_source: Literal["current season", "current + previous season"]

class BasketballPlayerStats(TypedDict):
    id: Optional[int]
    player_id: int
    game_id: str
    team_id: int
    league: str
    fouls: int
    blocks: int
    points: int
    steals: int
    assists: int
    minutes: float
    turnovers: int
    rebounds: int
    two_points_made: int
    field_goals_made: int
    free_throws_made: int
    three_points_made: int
    defensive_rebounds: int
    offensive_rebounds: int
    two_point_percentage: float
    two_points_attempted: int
    field_goals_attempted: int
    free_throws_attempted: int
    three_points_attempted: int
    status: str
    true_shooting_pct: float
    usage_rate: float
    rebounds_pct: float
    assists_pct: float
    blocks_pct: float
    steals_pct: float
    three_pct: float
    free_throw_pct: float
    points_rebounds_assists: int
    points_rebounds: int
    points_assists: int
    rebounds_assists: int

class BasketballTeamStats(TypedDict):
    id: Optional[int]
    team_id: int
    game_id: str
    league: str
    score: int
    fouls: int
    blocks: int
    steals: int
    assists: int
    turnovers: int
    rebounds: int
    two_points_made: int
    field_goals_made: int
    free_throws_made: int
    three_points_made: int
    defensive_rebounds: int
    offensive_rebounds: int
    two_point_percentage: float
    two_points_attempted: int
    field_goals_attempted: int
    free_throws_attempted: int
    three_points_attempted: int
    pace: float
    offensive_rating: float
    defensive_rating: float

def insert_basketball_team_stats(team_stats: Union[BasketballTeamStats, List[BasketballTeamStats]]) -> List[dict]:
    """Insert basketball team stats into the database"""
    if not isinstance(team_stats, list):
        team_stats = [team_stats]

    if not team_stats:
        raise ValueError("No team stat entries provided")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                insert_query = """
                    INSERT INTO basketball_team_stats (
                        team_id, game_id, league, score, fouls, blocks, steals, assists,
                        turnovers, rebounds, two_points_made, field_goals_made, free_throws_made,
                        three_points_made, defensive_rebounds, offensive_rebounds,
                        two_point_percentage, two_points_attempted, field_goals_attempted,
                        free_throws_attempted, three_points_attempted, pace, offensive_rating,
                        defensive_rating
                    ) VALUES (
                        %(team_id)s, %(game_id)s, %(league)s, %(score)s, %(fouls)s, %(blocks)s,
                        %(steals)s, %(assists)s, %(turnovers)s, %(rebounds)s, %(two_points_made)s,
                        %(field_goals_made)s, %(free_throws_made)s, %(three_points_made)s,
                        %(defensive_rebounds)s, %(offensive_rebounds)s, %(two_point_percentage)s,
                        %(two_points_attempted)s, %(field_goals_attempted)s, %(free_throws_attempted)s,
                        %(three_points_attempted)s, %(pace)s, %(offensive_rating)s, %(defensive_rating)s
                    )
                    RETURNING team_id, game_id;
                """

                results = []
                for entry in team_stats:
                    cur.execute(insert_query, entry)
                    results.append(cur.fetchone())

                conn.commit()
                logger.info(f"Successfully inserted {len(results)} team stat entries")
                return results

    except Exception as e:
        logger.error(f"Error inserting basketball team stats: {e}")
        raise

def insert_basketball_player_stats(player_stats: Union[BasketballPlayerStats, List[BasketballPlayerStats]]) -> List[dict]:
    """Insert basketball player stats into the database, filtering out players that don't exist"""
    if not isinstance(player_stats, list):
        player_stats = [player_stats]

    if not player_stats:
        raise ValueError("No player stat entries provided")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                # Get unique player IDs and league
                player_ids = list(set(entry['player_id'] for entry in player_stats))
                league = player_stats[0]['league']

                # Check which players exist in the database
                check_query = """
                    SELECT player_id FROM player
                    WHERE player_id = ANY(%(player_ids)s) AND league = %(league)s
                """
                cur.execute(check_query, {'player_ids': player_ids, 'league': league})
                existing_player_ids = {row['player_id'] for row in cur.fetchall()}

                # Filter valid entries
                valid_entries = [entry for entry in player_stats
                               if entry['player_id'] in existing_player_ids]

                if not valid_entries:
                    raise ValueError("No valid player entries found - all players missing from database")

                if len(valid_entries) != len(player_stats):
                    missing_player_ids = [entry['player_id'] for entry in player_stats
                                        if entry['player_id'] not in existing_player_ids]
                    logger.warning(f"Players not found in database, skipping: {', '.join(map(str, missing_player_ids))}")

                # Build dynamic INSERT query based on available fields
                def build_insert_query_and_params(entry):
                    # Required fields that must be present
                    required_fields = ['player_id', 'game_id', 'team_id', 'league', 'status']

                    # All possible fields with their defaults
                    all_fields = {
                        'fouls': 0, 'blocks': 0, 'points': 0, 'steals': 0, 'assists': 0, 'minutes': 0.0,
                        'turnovers': 0, 'rebounds': 0, 'two_points_made': 0, 'field_goals_made': 0,
                        'free_throws_made': 0, 'three_points_made': 0, 'defensive_rebounds': 0,
                        'offensive_rebounds': 0, 'two_point_percentage': 0.0, 'two_points_attempted': 0,
                        'field_goals_attempted': 0, 'free_throws_attempted': 0, 'three_points_attempted': 0,
                        'true_shooting_pct': 0.0, 'usage_rate': 0.0, 'rebounds_pct': 0.0, 'assists_pct': 0.0,
                        'blocks_pct': 0.0, 'steals_pct': 0.0, 'three_pct': 0.0, 'free_throw_pct': 0.0,
                        'points_rebounds_assists': 0, 'points_rebounds': 0, 'points_assists': 0,
                        'rebounds_assists': 0
                    }

                    # Build fields list - only include fields that are present in entry or required
                    fields_to_insert = []
                    params = {}

                    # Add required fields first
                    for field in required_fields:
                        if field not in entry:
                            raise ValueError(f"Required field '{field}' missing from entry")
                        fields_to_insert.append(field)
                        params[field] = entry[field]

                    # Add optional fields that are present in the entry
                    for field in all_fields:
                        if field in entry:
                            fields_to_insert.append(field)
                            params[field] = entry[field]
                        # Don't include fields that aren't in the entry - let DB use defaults

                    # Build the INSERT query using psycopg SQL composition
                    query = sql.SQL("""
                        INSERT INTO basketball_player_stats ({})
                        VALUES ({})
                        RETURNING id;
                    """).format(
                        sql.SQL(', ').join(sql.Identifier(field) for field in fields_to_insert),
                        sql.SQL(', ').join(sql.Placeholder(field) for field in fields_to_insert)
                    )

                    return query, params

                results = []
                for entry in valid_entries:
                    query, params = build_insert_query_and_params(entry)
                    cur.execute(query, params)
                    results.append(cur.fetchone())

                conn.commit()
                logger.info(f"Successfully inserted {len(results)} player stat entries ({len(player_stats) - len(valid_entries)} skipped)")
                return results

    except Exception as e:
        logger.error(f"Error inserting basketball player stats: {e}")
        raise

def get_basketball_player_stats(player_id: int, league: str, limit: int) -> List[BasketballPlayerStats]:
    """Get basketball player stats for a specific player"""
    if league not in ["NBA", "NCAABB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT bps.*
                    FROM basketball_player_stats bps
                    INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                    WHERE bps.player_id = %(player_id)s
                        AND bps.league = %(league)s
                        AND bps.status = 'ACT'
                    ORDER BY g.start_time DESC
                    LIMIT %(limit)s
                """

                cur.execute(query, {
                    'player_id': player_id,
                    'league': league,
                    'limit': limit
                })

                return cast(List[BasketballPlayerStats], cur.fetchall())

    except Exception as e:
        logger.error(f"Error retrieving basketball player stats: {e}")
        raise

def get_basketball_team_stats(team_id: int, league: str, limit: int) -> List[BasketballTeamStats]:
    """Get basketball team stats for a specific team"""
    if league not in ["NBA", "NCAABB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT bts.*
                    FROM basketball_team_stats bts
                    INNER JOIN game g ON bts.game_id = g.game_id AND bts.league = g.league
                    WHERE bts.team_id = %(team_id)s
                        AND bts.league = %(league)s
                    ORDER BY g.start_time DESC
                    LIMIT %(limit)s
                """

                cur.execute(query, {
                    'team_id': team_id,
                    'league': league,
                    'limit': limit
                })

                return cast(List[BasketballTeamStats], cur.fetchall())

    except Exception as e:
        logger.error(f"Error retrieving basketball team stats: {e}")
        raise

def get_player_team_stats(player_id: int, league: str, limit: int, is_opponent: bool = False) -> List[BasketballTeamStats]:
    """Get team stats for games where a player participated"""
    if league not in ["NBA", "NCAABB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                # First get the games and team info
                games_query = """
                    SELECT g.game_id, g.home_team_id, g.away_team_id, bps.team_id as player_team_id
                    FROM game g
                    INNER JOIN basketball_player_stats bps ON g.game_id = bps.game_id AND g.league = bps.league
                    WHERE bps.player_id = %(player_id)s
                        AND bps.league = %(league)s
                        AND bps.status = 'ACT'
                    ORDER BY g.start_time DESC
                    LIMIT %(limit)s
                """

                cur.execute(games_query, {
                    'player_id': player_id,
                    'league': league,
                    'limit': limit
                })

                games_result = cur.fetchall()

                if not games_result:
                    raise ValueError("Invalid playerId and league, no player stats found")

                team_stats = []
                for game_info in games_result:
                    if is_opponent:
                        target_team_id = (game_info['away_team_id']
                                        if game_info['home_team_id'] == game_info['player_team_id']
                                        else game_info['home_team_id'])
                    else:
                        target_team_id = game_info['player_team_id']

                    stats_query = """
                        SELECT * FROM basketball_team_stats
                        WHERE game_id = %(game_id)s
                            AND team_id = %(team_id)s
                            AND league = %(league)s
                    """

                    cur.execute(stats_query, {
                        'game_id': game_info['game_id'],
                        'team_id': target_team_id,
                        'league': league
                    })

                    stats = cur.fetchone()
                    if stats:
                        team_stats.append(cast(BasketballTeamStats, stats))

                return team_stats

    except Exception as e:
        logger.error(f"Error retrieving player team stats: {e}")
        raise

def get_basketball_stat_averages(league: str, stat: str, position: Optional[str] = None, min_games_threshold: int = 100) -> LeagueAverages:
    """Calculate league averages for a specific basketball stat"""
    if league not in ["NBA", "NCAABB"]:
        raise ValueError("Invalid league parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                from datetime import datetime
                now = datetime.now()
                current_year = now.year
                # Basketball seasons span calendar years (Oct/Nov to Apr/May)
                current_season_year = current_year if now.month >= 9 else current_year - 1

                # Build base query
                if position:
                    current_season_query = """
                        SELECT bps.*
                        FROM basketball_player_stats bps
                        INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                        INNER JOIN player p ON bps.player_id = p.player_id AND bps.league = p.league
                        WHERE bps.league = %(league)s
                            AND bps.status = 'ACT'
                            AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s)
                            AND p.position = ANY(%(position_array)s)
                    """
                else:
                    current_season_query = """
                        SELECT bps.*
                        FROM basketball_player_stats bps
                        INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                        WHERE bps.league = %(league)s
                            AND bps.status = 'ACT'
                            AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s)
                    """

                # Map position to position array
                position_array = None
                if position:
                    if position == "G":
                        position_array = ["G", "PG", "SG", "GF"]
                    elif position == "F":
                        position_array = ["GF", "F", "SF", "PF", "FC"]
                    elif position == "C":
                        position_array = ["FC", "C"]

                cur.execute(current_season_query, {
                    'league': league,
                    'current_season_year': current_season_year,
                    'next_year': current_season_year + 1,
                    'position_array': position_array
                })

                stats_list = cur.fetchall()

                # If not enough data, include previous season
                if len(stats_list) < min_games_threshold:
                    previous_season_year = current_season_year - 1

                    if position:
                        extended_query = """
                            SELECT bps.*
                            FROM basketball_player_stats bps
                            INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                            INNER JOIN player p ON bps.player_id = p.player_id AND bps.league = p.league
                            WHERE bps.league = %(league)s
                                AND bps.status = 'ACT'
                                AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(previous_season_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(previous_next_year)s)
                                AND p.position = ANY(%(position_array)s)
                        """
                    else:
                        extended_query = """
                            SELECT bps.*
                            FROM basketball_player_stats bps
                            INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                            WHERE bps.league = %(league)s
                                AND bps.status = 'ACT'
                                AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(previous_season_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(previous_next_year)s)
                        """

                    cur.execute(extended_query, {
                        'league': league,
                        'current_season_year': current_season_year,
                        'next_year': current_season_year + 1,
                        'previous_season_year': previous_season_year,
                        'previous_next_year': previous_season_year + 1,
                        'position_array': position_array
                    })

                    stats_list = cur.fetchall()

                if not stats_list:
                    raise ValueError("No stats found for specified period")

                # Calculate average
                total_stat = sum(stats.get(stat, 0) or 0 for stats in stats_list)
                average = total_stat / len(stats_list)

                return {
                    'stat': stat,
                    'average': round(average, 4),
                    'sample_size': len(stats_list),
                    'data_source': ('current + previous season'
                                  if len(stats_list) < min_games_threshold
                                  else 'current season')
                }

    except Exception as e:
        logger.error(f"Error calculating basketball stat averages: {e}")
        raise

def get_basketball_team_stats_for_player(player_id: int, league: str, limit: int) -> List[BasketballTeamStats]:
    """Get team stats for games where a player participated (wrapper for get_player_team_stats)"""
    return get_player_team_stats(player_id, league, limit, is_opponent=False)

def get_basketball_opponent_stats_for_player(player_id: int, league: str, limit: int) -> List[BasketballTeamStats]:
    """Get opponent team stats for games where a player participated (wrapper for get_player_team_stats)"""
    return get_player_team_stats(player_id, league, limit, is_opponent=True)

def get_basketball_league_averages(league: str, stat: str, position: Optional[str] = None) -> LeagueAverages:
    """Get league averages for a specific stat (wrapper for get_basketball_stat_averages)"""
    return get_basketball_stat_averages(league, stat, position)