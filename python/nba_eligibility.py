import sys
from datetime import datetime

import numpy as np
from nba_constants import min_num_stats, secondary_minutes_threshold, sigma_coeff
from nba_tables import nba_games, nba_player_stats, nba_players
from nba_types import CombinedStatType, MetricStats, StatType
from sqlalchemy import Engine, or_, select
from utils import db_response_to_json, get_current_season, get_last_season

_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


# gets the league mean and standard deviation of a specific stat
def get_metric_stats(
    engine: Engine, metric: str, position: str, use_playoffs: bool
) -> MetricStats:
    cache_key = (metric, position)
    if cache_key in _metric_stats_cache:
        return _metric_stats_cache[cache_key]

    with engine.connect() as conn:
        try:
            season = get_current_season()
            month = datetime.now().month
            if month <= 10 and month >= 7:
                season = get_last_season()

            column = getattr(nba_player_stats.c, metric)

            j = nba_player_stats.join(
                nba_games, nba_player_stats.c.game_id == nba_games.c.id
            ).join(nba_players, nba_player_stats.c.player_id == nba_players.c.id)

            game_type_value = "playoffs" if use_playoffs else "regular_season"

            stmt = (
                select(column)
                .select_from(j)
                .where(nba_player_stats.c.season == season)
                .where(nba_player_stats.c.min > 0)
                .where(nba_games.c.game_type == game_type_value)
                .where(nba_player_stats.c.player_id.is_not(None))
                .where(nba_players.c.position == position)
            )

            result = conn.execute(stmt).fetchall()

            if len(result) < min_num_stats:
                stmt = (
                    select(column)
                    .select_from(j)
                    .where(nba_player_stats.c.season == season)
                    .where(nba_player_stats.c.min > 0)
                    .where(
                        or_(
                            nba_games.c.game_type == "regular_season",
                            nba_games.c.game_type == "playoffs",
                        )
                    )
                    .where(nba_player_stats.c.player_id.is_not(None))
                    .where(nba_players.c.position == position)
                )

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

    try:
        with engine.connect() as conn:
            season = get_current_season()
            month = datetime.now().month
            if month <= 10 and month >= 7:
                season = get_last_season()

            j = nba_player_stats.join(
                nba_games, nba_player_stats.c.game_id == nba_games.c.id
            ).join(nba_players, nba_player_stats.c.player_id == nba_players.c.id)

            columns = [getattr(nba_player_stats.c, metric) for metric in metric_list]

            game_type_value = "playoffs" if use_playoffs else "regular_season"

            stmt = (
                select(*columns)
                .select_from(j)
                .where(nba_player_stats.c.season == season)
                .where(nba_player_stats.c.min > 0)
                .where(nba_player_stats.c.player_id.is_not(None))
                .where(nba_games.c.game_type == game_type_value)
                .where(nba_players.c.position == position)
            )

            result = conn.execute(stmt).fetchall()

            if len(result) < min_num_stats:
                stmt = (
                    select(*columns)
                    .select_from(j)
                    .where(nba_player_stats.c.season == season)
                    .where(nba_player_stats.c.min > 0)
                    .where(nba_player_stats.c.player_id.is_not(None))
                    .where(
                        or_(
                            nba_games.c.game_type == "regular_season",
                            nba_games.c.game_type == "playoffs",
                        )
                    )
                    .where(nba_players.c.position == position)
                )
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
