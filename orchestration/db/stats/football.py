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

class FootballPlayerStats(TypedDict):
    id: Optional[int]
    player_id: int
    team_id: int
    game_id: str
    league: str
    completions: int
    fumbles_lost: int
    rushing_long: float
    receiving_long: float
    passer_rating: float
    passing_yards: float
    rushing_yards: float
    receiving_yards: float
    passing_attempts: int
    rushing_attempts: int
    fumble_recoveries: int
    passing_touchdowns: int
    rushing_touchdowns: int
    receiving_touchdowns: int
    passing_interceptions: int
    receptions: int
    field_goals_attempted: int
    field_goals_made: int
    field_goals_long: float
    extra_points_attempted: int
    extra_points_made: int
    status: str
    completion_pct: float
    yards_per_attempt: float
    yards_per_completion: float
    yards_per_carry: float
    yards_per_reception: float
    field_goal_pct: float
    extra_point_pct: float
    receiving_rushing_touchdowns: int
    passing_rushing_touchdowns: int
    total_yards: float

class FootballTeamStats(TypedDict):
    id: Optional[int]
    team_id: int
    game_id: str
    league: str
    score: int
    sacks: float
    safeties: int
    penalties_total: int
    penalties_yards: int
    turnovers: int
    first_downs: int
    total_yards: float
    blocked_kicks: int
    blocked_punts: int
    kicks_blocked: int
    passing_yards: int
    punts_blocked: int
    rushing_yards: int
    defense_touchdowns: int
    defense_interceptions: int
    kick_return_touchdowns: int
    punt_return_touchdowns: int
    blocked_kick_touchdowns: int
    blocked_punt_touchdowns: int
    interception_touchdowns: int
    fumble_return_touchdowns: int
    defense_fumble_recoveries: int
    field_goal_return_touchdowns: int
    two_point_conversion_returns: int
    two_point_conversion_attempts: int
    passing_yards_allowed: int
    completions_allowed: int
    rushing_yards_allowed: int
    passing_touchdowns_allowed: int
    rushing_touchdowns_allowed: int
    completions: int
    passing_touchdowns: int
    rushing_touchdowns: int
    two_point_conversion_succeeded: int
    points_against_defense_special_teams: int

def insert_football_team_stats(team_stats: Union[FootballTeamStats, List[FootballTeamStats]]) -> List[dict]:
    """Insert football team stats into the database"""
    if not isinstance(team_stats, list):
        team_stats = [team_stats]

    if not team_stats:
        raise ValueError("No team stat entries provided")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                insert_query = """
                    INSERT INTO football_team_stats (
                        team_id, game_id, league, score, sacks, safeties, penalties_total,
                        penalties_yards, turnovers, first_downs, total_yards, blocked_kicks,
                        blocked_punts, kicks_blocked, passing_yards, punts_blocked, rushing_yards,
                        defense_touchdowns, defense_interceptions, kick_return_touchdowns,
                        punt_return_touchdowns, blocked_kick_touchdowns, blocked_punt_touchdowns,
                        interception_touchdowns, fumble_return_touchdowns, defense_fumble_recoveries,
                        field_goal_return_touchdowns, two_point_conversion_returns,
                        two_point_conversion_attempts, passing_yards_allowed, completions_allowed,
                        rushing_yards_allowed, passing_touchdowns_allowed, rushing_touchdowns_allowed,
                        completions, passing_touchdowns, rushing_touchdowns,
                        two_point_conversion_succeeded, points_against_defense_special_teams
                    ) VALUES (
                        %(team_id)s, %(game_id)s, %(league)s, %(score)s, %(sacks)s, %(safeties)s,
                        %(penalties_total)s, %(penalties_yards)s, %(turnovers)s, %(first_downs)s,
                        %(total_yards)s, %(blocked_kicks)s, %(blocked_punts)s, %(kicks_blocked)s,
                        %(passing_yards)s, %(punts_blocked)s, %(rushing_yards)s,
                        %(defense_touchdowns)s, %(defense_interceptions)s, %(kick_return_touchdowns)s,
                        %(punt_return_touchdowns)s, %(blocked_kick_touchdowns)s,
                        %(blocked_punt_touchdowns)s, %(interception_touchdowns)s,
                        %(fumble_return_touchdowns)s, %(defense_fumble_recoveries)s,
                        %(field_goal_return_touchdowns)s, %(two_point_conversion_returns)s,
                        %(two_point_conversion_attempts)s, %(passing_yards_allowed)s, %(completions_allowed)s,
                        %(rushing_yards_allowed)s, %(passing_touchdowns_allowed)s, %(rushing_touchdowns_allowed)s,
                        %(completions)s, %(passing_touchdowns)s, %(rushing_touchdowns)s,
                        %(two_point_conversion_succeeded)s, %(points_against_defense_special_teams)s
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
        logger.error(f"Error inserting football team stats: {e}")
        raise

def insert_football_player_stats(player_stats: Union[FootballPlayerStats, List[FootballPlayerStats]]) -> List[dict]:
    """Insert football player stats into the database, filtering out players that don't exist"""
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
                    required_fields = ['player_id', 'team_id', 'game_id', 'league', 'status']

                    # All possible fields with their defaults
                    all_fields = {
                        'completions': 0, 'fumbles_lost': 0, 'rushing_long': 0.0, 'receiving_long': 0.0,
                        'passer_rating': 0.0, 'passing_yards': 0.0, 'rushing_yards': 0.0, 'receiving_yards': 0.0,
                        'passing_attempts': 0, 'rushing_attempts': 0, 'fumble_recoveries': 0,
                        'passing_touchdowns': 0, 'rushing_touchdowns': 0, 'receiving_touchdowns': 0,
                        'passing_interceptions': 0, 'receptions': 0, 'field_goals_attempted': 0,
                        'field_goals_made': 0, 'field_goals_long': 0.0, 'extra_points_attempted': 0,
                        'extra_points_made': 0, 'completion_pct': 0.0, 'yards_per_attempt': 0.0,
                        'yards_per_completion': 0.0, 'yards_per_carry': 0.0, 'yards_per_reception': 0.0,
                        'field_goal_pct': 0.0, 'extra_point_pct': 0.0, 'receiving_rushing_touchdowns': 0,
                        'passing_rushing_touchdowns': 0, 'total_yards': 0.0
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
                        INSERT INTO football_player_stats ({})
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
        logger.error(f"Error inserting football player stats: {e}")
        raise

def get_football_player_stats(player_id: int, league: str, limit: int) -> List[FootballPlayerStats]:
    """Get football player stats for a specific player"""
    if league not in ["NFL", "NCAAFB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT fps.*
                    FROM football_player_stats fps
                    INNER JOIN game g ON fps.game_id = g.game_id
                    WHERE fps.player_id = %(player_id)s
                        AND fps.league = %(league)s
                        AND fps.status = 'ACT'
                    ORDER BY g.start_time DESC
                    LIMIT %(limit)s
                """

                cur.execute(query, {
                    'player_id': player_id,
                    'league': league,
                    'limit': limit
                })

                return cast(List[FootballPlayerStats], cur.fetchall())

    except Exception as e:
        logger.error(f"Error retrieving football player stats: {e}")
        raise

def get_football_team_stats(team_id: int, league: str, limit: int) -> List[FootballTeamStats]:
    """Get football team stats for a specific team"""
    if league not in ["NFL", "NCAAFB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT fts.*
                    FROM football_team_stats fts
                    INNER JOIN game g ON fts.game_id = g.game_id AND fts.league = g.league
                    WHERE fts.team_id = %(team_id)s
                        AND fts.league = %(league)s
                    ORDER BY g.start_time DESC
                    LIMIT %(limit)s
                """

                cur.execute(query, {
                    'team_id': team_id,
                    'league': league,
                    'limit': limit
                })

                return cast(List[FootballTeamStats], cur.fetchall())

    except Exception as e:
        logger.error(f"Error retrieving football team stats: {e}")
        raise

def get_player_team_stats(player_id: int, league: str, limit: int, is_opponent: bool = False) -> List[FootballTeamStats]:
    """Get team stats for games where a player participated"""
    if league not in ["NFL", "NCAAFB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                # First get the games and team info
                games_query = """
                    SELECT g.game_id, g.home_team_id, g.away_team_id, fps.team_id as player_team_id
                    FROM game g
                    INNER JOIN football_player_stats fps ON g.game_id = fps.game_id AND g.league = fps.league
                    WHERE fps.player_id = %(player_id)s
                        AND fps.league = %(league)s
                        AND fps.status = 'ACT'
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
                        SELECT * FROM football_team_stats
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
                        team_stats.append(cast(FootballTeamStats, stats))

                return team_stats

    except Exception as e:
        logger.error(f"Error retrieving player team stats: {e}")
        raise

def get_football_stat_averages(league: str, stat: str, position: Optional[str] = None, min_games_threshold: int = 100) -> LeagueAverages:
    """Calculate league averages for a specific football stat"""
    if league not in ["NFL", "NCAAFB"]:
        raise ValueError("Invalid league parameter")

    # Validate position if provided
    if position and position not in ["QB", "WR", "TE", "RB", "K", "PK"]:
        raise ValueError("Invalid position")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                from datetime import datetime
                now = datetime.now()
                current_year = now.year
                # Football seasons span calendar years (Aug/Sep to Jan/Feb)
                current_season_year = current_year if now.month >= 7 else current_year - 1

                # Build base query
                if position:
                    current_season_query = """
                        SELECT fps.*
                        FROM football_player_stats fps
                        INNER JOIN game g ON fps.game_id = g.game_id AND fps.league = g.league
                        INNER JOIN player p ON fps.player_id = p.player_id AND fps.league = p.league
                        WHERE fps.league = %(league)s
                            AND fps.status = 'ACT'
                            AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s)
                            AND (%(position)s = ANY(ARRAY['PK', 'K']) AND p.position = ANY(ARRAY['PK', 'K'])
                                OR p.position = %(position)s)
                    """
                else:
                    current_season_query = """
                        SELECT fps.*
                        FROM football_player_stats fps
                        INNER JOIN game g ON fps.game_id = g.game_id AND fps.league = g.league
                        WHERE fps.league = %(league)s
                            AND fps.status = 'ACT'
                            AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s)
                    """

                cur.execute(current_season_query, {
                    'league': league,
                    'current_season_year': current_season_year,
                    'next_year': current_season_year + 1,
                    'position': position
                })

                stats_list = cur.fetchall()

                # If not enough data, include previous season
                if len(stats_list) < min_games_threshold:
                    previous_season_year = current_season_year - 1

                    if position:
                        extended_query = """
                            SELECT fps.*
                            FROM football_player_stats fps
                            INNER JOIN game g ON fps.game_id = g.game_id AND fps.league = g.league
                            INNER JOIN player p ON fps.player_id = p.player_id AND fps.league = p.league
                            WHERE fps.league = %(league)s
                                AND fps.status = 'ACT'
                                AND (EXTRACT(YEAR FROM g.start_time) = %(current_season_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(next_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(previous_season_year)s
                                    OR EXTRACT(YEAR FROM g.start_time) = %(previous_next_year)s)
                                AND (%(position)s = ANY(ARRAY['PK', 'K']) AND p.position = ANY(ARRAY['PK', 'K'])
                                    OR p.position = %(position)s)
                        """
                    else:
                        extended_query = """
                            SELECT fps.*
                            FROM football_player_stats fps
                            INNER JOIN game g ON fps.game_id = g.game_id AND fps.league = g.league
                            WHERE fps.league = %(league)s
                                AND fps.status = 'ACT'
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
                        'position': position
                    })

                    stats_list = cur.fetchall()

                if not stats_list:
                    raise ValueError("No stats found for specified period")

                # Add extended stats calculations
                extended_stats_list = []
                for stats in stats_list:
                    extended_stats = dict(stats)
                    extended_stats['receiving_rushing_touchdowns'] = (
                        stats.get('receiving_touchdowns', 0) + stats.get('rushing_touchdowns', 0)
                    )
                    extended_stats['passing_rushing_touchdowns'] = (
                        stats.get('passing_touchdowns', 0) + stats.get('rushing_touchdowns', 0)
                    )
                    extended_stats_list.append(extended_stats)

                # Calculate average
                total_stat = sum(stats.get(stat, 0) or 0 for stats in extended_stats_list)
                average = total_stat / len(extended_stats_list)

                return {
                    'stat': stat,
                    'average': round(average, 4),
                    'sample_size': len(extended_stats_list),
                    'data_source': ('current + previous season'
                                  if len(stats_list) < min_games_threshold
                                  else 'current season')
                }

    except Exception as e:
        logger.error(f"Error calculating football stat averages: {e}")
        raise

def get_football_team_stats_for_player(player_id: int, league: str, limit: int) -> List[FootballTeamStats]:
    """Get team stats for games where a player participated (wrapper for get_player_team_stats)"""
    return get_player_team_stats(player_id, league, limit, is_opponent=False)

def get_football_opponent_stats_for_player(player_id: int, league: str, limit: int) -> List[FootballTeamStats]:
    """Get opponent team stats for games where a player participated (wrapper for get_player_team_stats)"""
    return get_player_team_stats(player_id, league, limit, is_opponent=True)

def get_football_league_averages(league: str, stat: str, position: Optional[str] = None) -> LeagueAverages:
    """Get league averages for a specific stat (wrapper for get_football_stat_averages)"""
    return get_football_stat_averages(league, stat, position)