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

class BaseballPlayerStats(TypedDict):
    id: Optional[int]
    errors: int
    hits: int
    runs: int
    singles: int
    doubles: int
    triples: int
    at_bats: int
    walks: int
    caught_stealing: int
    home_runs: int
    putouts: int
    stolen_bases: int
    strikeouts: int
    hit_by_pitch: int
    intentional_walks: int
    rbis: int
    outs: int
    hits_allowed: int
    pitching_strikeouts: int
    losses: int
    earned_runs: int
    saves: int
    runs_allowed: int
    wins: int
    singles_allowed: int
    doubles_allowed: int
    triples_allowed: int
    pitching_walks: int
    balks: int
    blown_saves: int
    pitching_caught_stealing: int
    home_runs_allowed: int
    innings_pitched: float
    pitching_putouts: int
    stolen_bases_allowed: int
    wild_pitches: int
    pitching_hit_by_pitch: int
    holds: int
    pitching_intentional_walks: int
    pitches_thrown: int
    strikes: int
    game_id: str
    player_id: int
    team_id: int
    league: str
    status: str
    batting_avg: float
    obp: float
    slugging_pct: float
    ops: float
    hits_runs_rbis: int
    era: float
    whip: float
    k_per_nine: float
    strike_pct: float

class BaseballTeamStats(TypedDict):
    id: Optional[int]
    errors: int
    hits: int
    runs: int
    doubles: int
    triples: int
    at_bats: int
    walks: int
    caught_stealing: int
    home_runs: int
    stolen_bases: int
    strikeouts: int
    rbis: int
    team_id: int
    league: str
    game_id: str
    home_runs_allowed: int
    doubles_allowed: int
    triples_allowed: int
    hits_allowed: int
    runs_allowed: int
    strikes: int
    pitching_walks: int
    pitches_thrown: int
    pitching_strikeouts: int
    batting_avg: float
    on_base_percentage: float
    pitching_caught_stealing: int
    slugging_pct: float
    ops: float
    stolen_bases_allowed: int
    earned_runs: int

def insert_baseball_team_stats(team_stats: Union[BaseballTeamStats, List[BaseballTeamStats]]) -> List[dict]:
    """Insert baseball team stats into the database"""
    if not isinstance(team_stats, list):
        team_stats = [team_stats]

    if not team_stats:
        raise ValueError("No team stat entries provided")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                insert_query = """
                    INSERT INTO baseball_team_stats (
                        errors, hits, runs, doubles, triples, at_bats, walks, caught_stealing,
                        home_runs, stolen_bases, strikeouts, rbis, team_id, league, game_id,
                        home_runs_allowed, doubles_allowed, triples_allowed, hits_allowed,
                        runs_allowed, strikes, pitching_walks, pitches_thrown, pitching_strikeouts,
                        batting_avg, on_base_percentage, pitching_caught_stealing, slugging_pct,
                        ops, stolen_bases_allowed, earned_runs
                    ) VALUES (
                        %(errors)s, %(hits)s, %(runs)s, %(doubles)s, %(triples)s, %(at_bats)s,
                        %(walks)s, %(caught_stealing)s, %(home_runs)s, %(stolen_bases)s,
                        %(strikeouts)s, %(rbis)s, %(team_id)s, %(league)s, %(game_id)s,
                        %(home_runs_allowed)s, %(doubles_allowed)s, %(triples_allowed)s,
                        %(hits_allowed)s, %(runs_allowed)s, %(strikes)s, %(pitching_walks)s,
                        %(pitches_thrown)s, %(pitching_strikeouts)s, %(batting_avg)s,
                        %(on_base_percentage)s, %(pitching_caught_stealing)s, %(slugging_pct)s,
                        %(ops)s, %(stolen_bases_allowed)s, %(earned_runs)s
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
        logger.error(f"Error inserting baseball team stats: {e}")
        raise

def insert_baseball_player_stats(player_stats: Union[BaseballPlayerStats, List[BaseballPlayerStats]]) -> List[dict]:
    """Insert baseball player stats into the database, filtering out players that don't exist"""
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
                    required_fields = ['game_id', 'player_id', 'team_id', 'league', 'status']

                    # All possible fields with their defaults
                    all_fields = {
                        'errors': 0, 'hits': 0, 'runs': 0, 'singles': 0, 'doubles': 0, 'triples': 0,
                        'at_bats': 0, 'walks': 0, 'caught_stealing': 0, 'home_runs': 0, 'putouts': 0,
                        'stolen_bases': 0, 'strikeouts': 0, 'hit_by_pitch': 0, 'intentional_walks': 0,
                        'rbis': 0, 'outs': 0, 'hits_allowed': 0, 'pitching_strikeouts': 0, 'losses': 0,
                        'earned_runs': 0, 'saves': 0, 'runs_allowed': 0, 'wins': 0, 'singles_allowed': 0,
                        'doubles_allowed': 0, 'triples_allowed': 0, 'pitching_walks': 0, 'balks': 0,
                        'blown_saves': 0, 'pitching_caught_stealing': 0, 'home_runs_allowed': 0,
                        'innings_pitched': 0.0, 'pitching_putouts': 0, 'stolen_bases_allowed': 0,
                        'wild_pitches': 0, 'pitching_hit_by_pitch': 0, 'holds': 0,
                        'pitching_intentional_walks': 0, 'pitches_thrown': 0, 'strikes': 0,
                        'batting_avg': 0.0, 'obp': 0.0, 'slugging_pct': 0.0, 'ops': 0.0,
                        'hits_runs_rbis': 0, 'era': 0.0, 'whip': 0.0, 'k_per_nine': 0.0, 'strike_pct': 0.0
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
                    for field, default_value in all_fields.items():
                        if field in entry:
                            fields_to_insert.append(field)
                            params[field] = entry[field]
                        # Don't include fields that aren't in the entry - let DB use defaults

                    # Build the INSERT query using psycopg SQL composition
                    query = sql.SQL("""
                        INSERT INTO baseball_player_stats ({})
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
        logger.error(f"Error inserting baseball player stats: {e}")
        raise

def get_baseball_player_stats(player_id: int, league: str, limit: int) -> List[BaseballPlayerStats]:
    """Get baseball player stats for a specific player"""
    if league not in ["MLB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT bps.*
                    FROM baseball_player_stats bps
                    INNER JOIN game g ON bps.game_id = g.game_id
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

                return cast(List[BaseballPlayerStats], cur.fetchall())

    except Exception as e:
        logger.error(f"Error retrieving baseball player stats: {e}")
        raise

def get_baseball_team_stats(team_id: int, league: str, limit: int) -> List[BaseballTeamStats]:
    """Get baseball team stats for a specific team"""
    if league not in ["MLB"]:
        raise ValueError("Invalid league parameter")

    if limit <= 0:
        raise ValueError("Invalid limit parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT bts.*
                    FROM baseball_team_stats bts
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

                return cast(List[BaseballTeamStats], cur.fetchall())

    except Exception as e:
        logger.error(f"Error retrieving baseball team stats: {e}")
        raise

def get_player_team_stats(player_id: int, league: str, limit: int, is_opponent: bool = False) -> List[BaseballTeamStats]:
    """Get team stats for games where a player participated"""
    if league not in ["MLB"]:
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
                    INNER JOIN baseball_player_stats bps ON g.game_id = bps.game_id AND g.league = bps.league
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
                        SELECT * FROM baseball_team_stats
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
                        team_stats.append(cast(BaseballTeamStats, stats))

                return team_stats

    except Exception as e:
        logger.error(f"Error retrieving player team stats: {e}")
        raise

def get_baseball_stat_averages(league: str, stat: str, min_games_threshold: int = 100) -> LeagueAverages:
    """Calculate league averages for a specific baseball stat"""
    if league not in ["MLB"]:
        raise ValueError("Invalid league parameter")

    try:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                from datetime import datetime
                current_year = datetime.now().year

                # First try current season
                current_season_query = """
                    SELECT bps.*
                    FROM baseball_player_stats bps
                    INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                    WHERE bps.league = %(league)s
                        AND bps.status = 'ACT'
                        AND EXTRACT(YEAR FROM g.start_time) = %(current_year)s
                """

                cur.execute(current_season_query, {
                    'league': league,
                    'current_year': current_year
                })

                stats_list = cur.fetchall()

                # If not enough data, include previous season
                if len(stats_list) < min_games_threshold:
                    past_year = current_year - 1

                    extended_query = """
                        SELECT bps.*
                        FROM baseball_player_stats bps
                        INNER JOIN game g ON bps.game_id = g.game_id AND bps.league = g.league
                        WHERE bps.league = %(league)s
                            AND bps.status = 'ACT'
                            AND (EXTRACT(YEAR FROM g.start_time) = %(current_year)s
                                OR EXTRACT(YEAR FROM g.start_time) = %(past_year)s)
                    """

                    cur.execute(extended_query, {
                        'league': league,
                        'current_year': current_year,
                        'past_year': past_year
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
        logger.error(f"Error calculating baseball stat averages: {e}")
        raise

def get_baseball_team_stats_for_player(player_id: int, league: str, limit: int) -> List[BaseballTeamStats]:
    """Get team stats for games where a player participated (wrapper for get_player_team_stats)"""
    return get_player_team_stats(player_id, league, limit, is_opponent=False)

def get_baseball_opponent_stats_for_player(player_id: int, league: str, limit: int) -> List[BaseballTeamStats]:
    """Get opponent team stats for games where a player participated (wrapper for get_player_team_stats)"""
    return get_player_team_stats(player_id, league, limit, is_opponent=True)

def get_baseball_league_averages(league: str, stat: str) -> LeagueAverages:
    """Get league averages for a specific stat (wrapper for get_baseball_stat_averages)"""
    return get_baseball_stat_averages(league, stat)