import random
import sys
from datetime import datetime

import numpy as np
from nba_constants import (
    secondary_fallback_pct,
    soft_k_subtrahend,
    strict_k_high_volume,
    strict_k_low_volume,
)
from nba_tables import nba_games, nba_player_stats, nba_players
from nba_types import CombinedStatType, MetricStats, StatType
from sqlalchemy import Engine, select
from utils import db_response_to_json, get_current_season, get_last_season


def get_dynamic_sigma_coeff(mpg: float) -> float:
    min_sigma = 0.2  # low MPG = still has a shot
    max_sigma = 1  # high MPG = forgiving fallback
    max_mpg = 35.0

    mpg = min(max(mpg, 0), max_mpg)
    return min_sigma + (max_sigma - min_sigma) * (mpg / max_mpg)


_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


# gets the league mean and standard deviation of a specific stat
def get_metric_stats(engine: Engine, metric: str, position: str) -> MetricStats:
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

            stmt = (
                select(column)
                .select_from(j)
                .where(nba_player_stats.c.season == season)
                .where(nba_player_stats.c.min > 0)
                .where(nba_player_stats.c.player_id.is_not(None))
                .where(nba_games.c.game_type == "regular_season")
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
    engine: Engine, metric_list: list[str], position: str
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

            stmt = (
                select(*columns)
                .select_from(j)
                .where(nba_player_stats.c.season == season)
                .where(nba_player_stats.c.min > 0)
                .where(nba_player_stats.c.player_id.is_not(None))
                .where(nba_games.c.game_type == "regular_season")
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
) -> bool:
    stat_desc = get_metric_stats(engine, stat_type, position)
    strict_k = (
        strict_k_high_volume
        if stat_type in ["pts", "reb", "ast"]
        else strict_k_low_volume
    )
    standard_thresh = stat_desc["mean"] + strict_k * stat_desc["sd"]
    if player_stat_average >= standard_thresh:
        return True
    else:
        soft_k = max(0.1, strict_k - soft_k_subtrahend)
        if player_stat_average >= stat_desc["mean"] + soft_k * stat_desc["sd"]:
            if random.random() < secondary_fallback_pct:
                return True
            else:
                sigma_coeff = get_dynamic_sigma_coeff(mpg)
                rand_thresh = stat_desc["mean"] - random.gauss(
                    0, sigma_coeff * stat_desc["sd"]
                )
                return player_stat_average >= rand_thresh


# checks if a player is eligible for a prop generation for a combined metric
def is_combined_stat_prop_eligible(
    engine: Engine,
    stat_type: CombinedStatType,
    player_stat_average: float,
    position: str,
    mpg: float,
) -> bool:
    combined_metric_list: list[str] = []
    if stat_type == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat_type == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat_type == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(engine, combined_metric_list, position)
    strict_k = strict_k_high_volume
    standard_thresh = stat_desc["mean"] + strict_k * stat_desc["sd"]
    if player_stat_average >= standard_thresh:
        return True
    else:
        soft_k = strict_k - soft_k_subtrahend
        if player_stat_average >= stat_desc["mean"] + soft_k * stat_desc["sd"]:
            if random.random() < secondary_fallback_pct:
                return True
            else:
                sigma_coeff = get_dynamic_sigma_coeff(mpg)
                rand_thresh = stat_desc["mean"] - random.gauss(
                    0, sigma_coeff * stat_desc["sd"]
                )
                rand_thresh = min(rand_thresh, standard_thresh)
                return player_stat_average >= rand_thresh
