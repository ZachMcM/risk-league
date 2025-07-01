import sys

import numpy as np
from nba.constants import min_num_stats, secondary_minutes_threshold
from shared.constants import sigma_coeff
from nba.my_types import CombinedStatType, MetricStats, StatType
from shared.tables import t_nba_games, t_nba_player_stats, t_players
from nba.utils import get_current_season, get_last_season
from shared.utils import db_response_to_json
from sqlalchemy import Engine, or_, select

_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


# gets the league mean and standard deviation of a specific stat
def get_metric_stats(
    engine: Engine, metric: str, position: str, use_playoffs: bool
) -> MetricStats:
    cache_key = (metric, position)
    if cache_key in _metric_stats_cache:
        return _metric_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        return (
            select(getattr(t_nba_player_stats.c, metric))
            .select_from(
                t_nba_player_stats.join(
                    t_nba_games, t_nba_player_stats.c.game_id == t_nba_games.c.id
                ).join(t_players, t_nba_player_stats.c.player_id == t_players.c.id)
            )
            .where(*game_type_filter)
            .where(*season_filter)
            .where(t_nba_player_stats.c.min > 0)
            .where(t_nba_player_stats.c.player_id.is_not(None))
            .where(t_players.c.position == position)
        )

    try:
        with engine.connect() as conn:
            season = get_current_season()

            # Primary filters
            game_type = "playoffs" if use_playoffs else "regular_season"
            stmt = build_stmt(
                [t_nba_games.c.game_type == game_type],
                [t_nba_player_stats.c.season == season],
            )

            result = conn.execute(stmt).fetchall()

            # Fallback if not enough stats
            if len(result) < min_num_stats:
                if use_playoffs:
                    # Combine regular and playoffs for current season
                    game_type_filter = [
                        or_(
                            t_nba_games.c.game_type == "regular_season",
                            t_nba_games.c.game_type == "playoffs",
                        )
                    ]
                    season_filter = [t_nba_player_stats.c.season == season]
                else:
                    # Use two seasons for regular season stats
                    game_type_filter = [t_nba_games.c.game_type == "regular_season"]
                    season_filter = [
                        or_(
                            t_nba_player_stats.c.season == season,
                            t_nba_player_stats.c.season == get_last_season(),
                        )
                    ]

                stmt = build_stmt(game_type_filter, season_filter)
                result = conn.execute(stmt).fetchall()

            stats = db_response_to_json(result, metric)
            metric_stats = {"mean": np.mean(stats), "sd": np.std(stats)}
            _metric_stats_cache[cache_key] = metric_stats
            return metric_stats

    except Exception as e:
        print(
            f"⚠️ Error getting stats for metric {metric} for the {get_current_season()} season, {e}"
        )
        sys.exit(1)


_combined_stats_cache: dict[tuple[tuple[str, ...], str], MetricStats] = {}


# gets the league mean and standard deviation of combined metrics
def get_combined_metric_stats(
    engine: Engine, metric_list: list[str], position: str, use_playoffs: bool
) -> MetricStats:
    cache_key = (tuple(sorted(metric_list)), position)
    if cache_key in _combined_stats_cache:
        return _combined_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        columns = [getattr(t_nba_player_stats.c, metric) for metric in metric_list]
        return (
            select(*columns)
            .select_from(
                t_nba_player_stats.join(
                    t_nba_games, t_nba_player_stats.c.game_id == t_nba_games.c.id
                ).join(t_players, t_nba_player_stats.c.player_id == t_players.c.id)
            )
            .where(*game_type_filter)
            .where(*season_filter)
            .where(t_nba_player_stats.c.min > 0)
            .where(t_nba_player_stats.c.player_id.is_not(None))
            .where(t_players.c.position == position)
        )

    try:
        with engine.connect() as conn:
            season = get_current_season()

            game_type = "playoffs" if use_playoffs else "regular_season"
            stmt = build_stmt(
                [t_nba_games.c.game_type == game_type],
                [t_nba_player_stats.c.season == season],
            )
            result = conn.execute(stmt).fetchall()

            if len(result) < min_num_stats:
                if use_playoffs:
                    game_type_filter = [
                        or_(
                            t_nba_games.c.game_type == "regular_season",
                            t_nba_games.c.game_type == "playoffs",
                        )
                    ]
                    season_filter = [t_nba_player_stats.c.season == season]
                else:
                    game_type_filter = [t_nba_games.c.game_type == "regular_season"]
                    season_filter = [
                        or_(
                            t_nba_player_stats.c.season == season,
                            t_nba_player_stats.c.season == get_last_season(),
                        )
                    ]

                stmt = build_stmt(game_type_filter, season_filter)
                result = conn.execute(stmt).fetchall()

            combined_values = [sum(row) for row in result]
            stat = {
                "mean": np.mean(combined_values),
                "sd": np.std(combined_values),
            }
            _combined_stats_cache[cache_key] = stat
            return stat

    except Exception as e:
        print(
            f"⚠️ Error getting stats for metrics {metric_list} for the {get_current_season()} season, {e}"
        )
        sys.exit(1)


# Determines if a player is eligible for a prop on a certain stat
def is_prop_eligible(
    engine: Engine,
    stat_type: StatType,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    stat_desc = get_metric_stats(engine, stat_type, position, use_playoffs)
    return (
        mpg > secondary_minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )


# checks if a player is eligible for a prop generation for a combined metric
def is_combined_stat_prop_eligible(
    engine: Engine,
    stat_type: CombinedStatType,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    combined_metric_list: list[str] = []
    if stat_type == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat_type == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat_type == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(
        engine, combined_metric_list, position, use_playoffs
    )

    return (
        mpg > secondary_minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )
