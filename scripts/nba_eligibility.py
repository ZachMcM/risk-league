import random
import sys
from datetime import datetime

import numpy as np
from constants import minutes_threshold, sigma_coeff, stat_constants
from my_types import CombinedStatType, MetricStats, StatType
from sqlalchemy import Engine, select
from tables import nba_games, nba_player_stats, nba_players
from utils import db_response_to_json, get_current_season, get_last_season

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
                .where(nba_player_stats.c.min >= minutes_threshold)
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
                .where(nba_player_stats.c.min >= minutes_threshold)
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
    engine: Engine, stat_type: StatType, player_stat: float, position: str
) -> bool:
    stat_desc = get_metric_stats(engine, stat_type, position)
    if player_stat >= stat_desc["mean"] + stat_constants[stat_type]["standard"]:
        return True
    else:
        rand_thresh = (
            stat_desc["mean"]
            - stat_constants[stat_type]["fallback"]
            + random.gauss(0, sigma_coeff * stat_constants[stat_type]["fallback"])
        )
        return player_stat >= rand_thresh


# checks if a player is eligible for a prop generation for a combined metric
def is_combined_stat_prop_eligible(
    engine: Engine, stat_type: CombinedStatType, player_stat: float, position: str
) -> bool:
    combined_metric_list: list[str] = []
    if stat_type == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat_type == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat_type == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(engine, combined_metric_list, position)
    if player_stat >= stat_desc["mean"] + stat_constants[stat_type]["standard"]:
        return True
    else:
        rand_thresh = (
            stat_desc["mean"]
            - stat_constants[stat_type]["fallback"]
            + random.gauss(0, sigma_coeff * stat_constants[stat_type]["fallback"])
        )
        return player_stat >= rand_thresh
