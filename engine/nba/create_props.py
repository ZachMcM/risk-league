import os
import sys
from datetime import datetime
from time import time

import numpy as np
import pandas as pd
import requests
from nba.constants import (
    min_num_stats,
    minutes_threshold,
    n_games,
    secondary_minutes_threshold,
    sigma_coeff,
    bias,
)
from dotenv import load_dotenv
from my_types import CombinedStat, NbaGame, NbaPlayerStats, PlayerData, Stat, stats_arr
from nba.utils import get_game_type
from shared.my_types import MetricStats, Player
from shared.tables import t_nba_games, t_nba_player_stats, t_players, t_props
from shared.utils import (
    db_response_to_json,
    round_prop,
    calculate_weighted_arithmetic_mean,
)
from sklearn.linear_model import Ridge, PoissonRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy import and_, create_engine, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from utils import get_current_season, get_last_season

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def generate_prop(
    stat: str,
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
    team_opp_games: list[NbaGame],
) -> float:
    if stat == "pts":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "fga": [game["fga"] for game in last_games],
                "three_pa": [game["three_pa"] for game in last_games],
                "true_shooting": [game["true_shooting"] for game in last_games],
                "pace": [game["pace"] for game in team_last_games],
                "usage_rate": [game["usage_rate"] for game in last_games],
                "opp_def_rating": [game["def_rating"] for game in team_opp_games],
                "team_off_rating": [game["off_rating"] for game in team_last_games],
                "pts": [game["pts"] for game in last_games],
            }
        )
        x_values = data[
            [
                "min",
                "fga",
                "three_pa",
                "true_shooting",
                "pace",
                "usage_rate",
                "opp_def_rating",
                "team_off_rating",
            ]
        ]
        y_values = data["pts"]

        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)

        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "fga": calculate_weighted_arithmetic_mean(data["fga"]),
                    "three_pa": calculate_weighted_arithmetic_mean(data["three_pa"]),
                    "true_shooting": calculate_weighted_arithmetic_mean(
                        data["true_shooting"]
                    ),
                    "pace": calculate_weighted_arithmetic_mean(data["pace"]),
                    "usage_rate": calculate_weighted_arithmetic_mean(
                        data["usage_rate"]
                    ),
                    "opp_def_rating": calculate_weighted_arithmetic_mean(
                        [game["def_rating"] for game in matchup_last_games]
                    ),
                    "team_off_rating": calculate_weighted_arithmetic_mean(
                        data["team_off_rating"]
                    ),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["pts"], ddof=1)

    elif stat == "reb":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "reb_pct": [game["reb_pct"] for game in last_games],
                "dreb_pct": [game["dreb_pct"] for game in last_games],
                "oreb_pct": [game["oreb_pct"] for game in last_games],
                "opp_fg_pct": [
                    0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                    for game in team_opp_games
                ],
                "opp_pace": [game["pace"] for game in team_opp_games],
                "reb": [game["reb"] for game in last_games],
            }
        )
        x_values = data[
            ["min", "reb_pct", "dreb_pct", "oreb_pct", "opp_fg_pct", "opp_pace"]
        ]
        y_values = data["reb"]

        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)

        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "reb_pct": calculate_weighted_arithmetic_mean(data["reb_pct"]),
                    "dreb_pct": calculate_weighted_arithmetic_mean(data["dreb_pct"]),
                    "oreb_pct": calculate_weighted_arithmetic_mean(data["oreb_pct"]),
                    "opp_fg_pct": calculate_weighted_arithmetic_mean(
                        [
                            0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                            for game in matchup_last_games
                        ]
                    ),
                    "opp_pace": calculate_weighted_arithmetic_mean(
                        [game["pace"] for game in matchup_last_games]
                    ),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["reb"], ddof=1)

    elif stat == "ast":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "ast_pct": [game["ast_pct"] for game in last_games],
                "ast_ratio": [game["ast_ratio"] for game in last_games],
                "team_fg_pct": [
                    0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                    for game in team_last_games
                ],
                "usage_rate": [game["usage_rate"] for game in last_games],
                "team_off_rating": [game["off_rating"] for game in team_last_games],
                "opp_def_rating": [game["def_rating"] for game in team_opp_games],
                "ast": [game["ast"] for game in last_games],
            }
        )
        x_values = data[
            [
                "min",
                "ast_pct",
                "ast_ratio",
                "team_fg_pct",
                "usage_rate",
                "team_off_rating",
                "opp_def_rating",
            ]
        ]
        y_values = data["ast"]
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "ast_pct": calculate_weighted_arithmetic_mean(data["ast_pct"]),
                    "ast_ratio": calculate_weighted_arithmetic_mean(data["ast_ratio"]),
                    "team_fg_pct": calculate_weighted_arithmetic_mean(
                        data["team_fg_pct"]
                    ),
                    "usage_rate": calculate_weighted_arithmetic_mean(
                        data["usage_rate"]
                    ),
                    "team_off_rating": calculate_weighted_arithmetic_mean(
                        data["team_off_rating"]
                    ),
                    "opp_def_rating": calculate_weighted_arithmetic_mean(
                        [game["def_rating"] for game in matchup_last_games]
                    ),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["ast"], ddof=1)

    elif stat == "three_pm":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "team_off_rating": [game["off_rating"] for game in team_last_games],
                "opp_def_rating": [game["def_rating"] for game in team_opp_games],
                "usage_rate": [game["usage_rate"] for game in last_games],
                "three_pa": [game["three_pa"] for game in last_games],
                "three_pct": [
                    (
                        0
                        if game["three_pa"] == 0
                        else (game["three_pm"] / game["three_pa"]) * 100
                    )
                    for game in last_games
                ],
                "three_pm": [game["three_pm"] for game in last_games],
            }
        )
        x_values = data[
            [
                "min",
                "team_off_rating",
                "opp_def_rating",
                "usage_rate",
                "three_pa",
                "three_pct",
            ]
        ]
        y_values = data["three_pm"]
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "team_off_rating": calculate_weighted_arithmetic_mean(
                        data["team_off_rating"]
                    ),
                    "opp_def_rating": calculate_weighted_arithmetic_mean(
                        [game["def_rating"] for game in matchup_last_games]
                    ),
                    "usage_rate": calculate_weighted_arithmetic_mean(
                        data["usage_rate"]
                    ),
                    "three_pa": calculate_weighted_arithmetic_mean(data["three_pa"]),
                    "three_pct": calculate_weighted_arithmetic_mean(data["three_pct"]),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["three_pm"], ddof=1)

    elif stat == "blk":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "pct_blk_a": [
                    (
                        0
                        if team_last_games[i]["blk"] == 0
                        else (game["blk"] / team_last_games[i]["blk"]) * 100
                    )
                    for i, game in enumerate(last_games)
                ],
                "opp_pace": [game["pace"] for game in team_opp_games],
                "opp_off_rating": [game["off_rating"] for game in team_opp_games],
                "team_def_rating": [game["def_rating"] for game in team_last_games],
                "blk": [game["blk"] for game in last_games],
            }
        )
        x_values = data[
            ["min", "pct_blk_a", "opp_pace", "opp_off_rating", "team_def_rating"]
        ]
        y_values = data["blk"]
        model = make_pipeline(
            StandardScaler(),
            PoissonRegressor(alpha=1)
        )
        model.fit(x_values, y_values)
        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "pct_blk_a": calculate_weighted_arithmetic_mean(data["pct_blk_a"]),
                    "opp_pace": calculate_weighted_arithmetic_mean([game["pace"] for game in matchup_last_games]),
                    "opp_off_rating": calculate_weighted_arithmetic_mean(
                        [game["off_rating"] for game in matchup_last_games]
                    ),
                    "team_def_rating": calculate_weighted_arithmetic_mean(data["team_def_rating"]),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["blk"], ddof=1)

    elif stat == "stl":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "team_def_rating": [game["def_rating"] for game in team_last_games],
                "opp_off_rating": [game["off_rating"] for game in team_opp_games],
                "opp_pace": [game["pace"] for game in team_opp_games],
                "pct_stl_a": [
                    (
                        0
                        if team_last_games[i]["stl"] == 0
                        else (game["stl"] / team_last_games[i]["stl"]) * 100
                    )
                    for i, game in enumerate(last_games)
                ],
                "opp_tov": [game["tov"] for game in team_opp_games],
                "opp_tov_ratio": [game["tov_ratio"] for game in team_opp_games],
                "opp_tov_pct": [game["tov_pct"] for game in team_opp_games],
                "stl": [game["stl"] for game in last_games],
            }
        )
        x_values = data[
            [
                "min",
                "team_def_rating",
                "opp_off_rating",
                "opp_pace",
                "pct_stl_a",
                "opp_tov",
                "opp_tov_ratio",
                "opp_tov_pct",
            ]
        ]
        y_values = data["stl"]
        model = make_pipeline(
            StandardScaler(),
            PoissonRegressor(alpha=1)
        )
        model.fit(x_values, y_values)
        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "team_def_rating": calculate_weighted_arithmetic_mean(data["team_def_rating"]),
                    "opp_off_rating": calculate_weighted_arithmetic_mean(
                        [game["off_rating"] for game in matchup_last_games]
                    ),
                    "opp_pace": calculate_weighted_arithmetic_mean([game["pace"] for game in matchup_last_games]),
                    "pct_stl_a": calculate_weighted_arithmetic_mean(data["pct_stl_a"]),
                    "opp_tov": calculate_weighted_arithmetic_mean([game["tov"] for game in matchup_last_games]),
                    "opp_tov_ratio": calculate_weighted_arithmetic_mean(
                        [game["tov_ratio"] for game in matchup_last_games]
                    ),
                    "opp_tov_pct": calculate_weighted_arithmetic_mean(
                        [game["tov_pct"] for game in matchup_last_games]
                    ),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["stl"], ddof=1)

    elif stat == "tov":
        data = pd.DataFrame(
            {
                "min": [game["min"] for game in last_games],
                "usage_rate": [game["usage_rate"] for game in last_games],
                "team_off_rating": [game["off_rating"] for game in team_last_games],
                "opp_def_rating": [game["def_rating"] for game in team_opp_games],
                "tov_ratio": [game["tov_ratio"] for game in last_games],
                "opp_stl": [game["stl"] for game in team_opp_games],
                "tov": [game["tov"] for game in last_games],
            }
        )
        x_values = data[
            [
                "min",
                "usage_rate",
                "team_off_rating",
                "opp_def_rating",
                "tov_ratio",
                "opp_stl",
            ]
        ]
        y_values = data["tov"]
        model = make_pipeline(
            StandardScaler(),
            Ridge(alpha=1)
        )
        model.fit(x_values, y_values)
        next_game_features = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "usage_rate": calculate_weighted_arithmetic_mean(data["usage_rate"]),
                    "team_off_rating": calculate_weighted_arithmetic_mean(data["team_off_rating"]),
                    "opp_def_rating": calculate_weighted_arithmetic_mean(
                        [game["def_rating"] for game in matchup_last_games]
                    ),
                    "tov_ratio": calculate_weighted_arithmetic_mean(data["tov_ratio"]),
                    "opp_stl": calculate_weighted_arithmetic_mean([game["stl"] for game in matchup_last_games]),
                }
            ]
        )
        predicted_value = model.predict(next_game_features)[0]
        sd = np.std(data["tov"], ddof=1)

    else:
        raise ValueError(f"Unknown stat: {stat}")

    final_prop = predicted_value + bias * sd
    return round_prop(final_prop)


_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


# for this particular function we call what we typically call "stat", "metric" because we use stats to describe the "descriptive statistics of the metri"
def get_metric_stats(metric: str, position: str, use_playoffs: bool) -> MetricStats:
    """Gets the league mean and standard deviation of a specific stat"""
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
    metric_list: list[str], position: str, use_playoffs: bool
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
    stat: Stat,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    stat_desc = get_metric_stats(stat, position, use_playoffs)
    return (
        mpg > secondary_minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )


# checks if a player is eligible for a prop generation for a combined metric
def is_combined_stat_prop_eligible(
    stat: CombinedStat,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    combined_metric_list: list[str] = []
    if stat == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(combined_metric_list, position, use_playoffs)

    return (
        mpg > secondary_minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )


# gets all the games for today
def get_today_games(test_date=None):
    url = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json"
    res = requests.get(url)
    data = res.json()

    today_str = datetime.today().strftime("%m/%d/%Y 00:00:00")

    if test_date is not None:
        today_str = test_date + " 00:00:00"

    for date in data["leagueSchedule"]["gameDates"]:
        if date["gameDate"] == today_str:
            return date["games"]

    return []


# get a list of all the player_ids from a team
def get_players_from_team(team_id: str) -> list[Player]:
    try:
        with engine.connect() as conn:
            stmt = select(t_players).where(
                t_players.c.team_id == str(team_id),
            )
            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ Error fetching roster for team {team_id}: {e}")
        sys.exit(1)


def get_games_by_id(id_list: list[str]) -> list[NbaGame]:
    try:
        with engine.connect() as conn:
            stmt = (
                select(t_nba_games)
                .where(t_nba_games.c.id.in_(id_list))
                .where(
                    or_(
                        t_nba_games.c.game_type == "regular_season",
                        t_nba_games.c.game_type == "playoffs",
                    )
                )
                .order_by(t_nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching games by id, {e}")
        sys.exit(1)


def get_opposing_team_games_for_games(id_list: list[str]) -> list[NbaGame]:
    conditions = []
    for game_id in id_list:
        raw_game_id, _ = game_id.split("-")
        game_prefix = f"{raw_game_id}-"

        conditions.append(
            and_(
                t_nba_games.c.id.startswith(game_prefix),
                t_nba_games.c.id != raw_game_id,
            )
        )

    try:
        with engine.connect() as conn:
            stmt = (
                select(t_nba_games)
                .where(or_(*conditions))
                .where(
                    or_(
                        t_nba_games.c.game_type == "regular_season",
                        t_nba_games.c.game_type == "playoffs",
                    )
                )
                .order_by(t_nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching opposing team games {e}")
        sys.exit(1)


# gets the last n_games games for a team
def get_team_last_games(team_id: str) -> list[NbaGame] | list[str]:
    try:
        with engine.connect() as conn:
            stmt = (
                select(t_nba_games)
                .where(t_nba_games.c.team_id == str(team_id))
                .where(
                    or_(
                        t_nba_games.c.game_type == "regular_season",
                        t_nba_games.c.game_type == "playoffs",
                    )
                )
                .order_by(t_nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)
            return last_games
    except Exception as e:
        print(f"⚠️  There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)


# returns a players last n_games games if they are eligible for a prop
def get_player_last_games(player_id) -> list[NbaPlayerStats] | None:
    try:
        with engine.connect() as conn:
            j = t_nba_player_stats.join(
                t_nba_games, t_nba_player_stats.c.game_id == t_nba_games.c.id
            )

            stmt = (
                select(t_nba_player_stats)
                .select_from(j)
                .where(
                    or_(
                        t_nba_games.c.game_type == "regular_season",
                        t_nba_games.c.game_type == "playoffs",
                    )
                )
                .where(t_nba_player_stats.c.player_id == str(player_id))
                .order_by(t_nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            # if no games were found or
            # the player didn't play enough out of the teams last n games
            # or the player doesn't average enough minutes we return null to skip this player

            avg_minutes = (
                0
                if len(last_games) == 0
                else sum(game["min"] for game in last_games) / len(last_games)
            )

            if len(last_games) != n_games or avg_minutes < minutes_threshold:
                print(f"🚨 Skipping player {player_id}\n")
                return None
            else:
                return last_games

    except Exception as e:
        print(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


# inserts a prop into the database
def insert_prop(
    line: float, game_id: str, player_id: str, stat: str, game_start_time: datetime
):
    try:
        with engine.begin() as conn:
            stmt = pg_insert(t_props).values(
                line=line,
                raw_game_id=game_id,
                player_id=player_id,
                stat=stat,
                game_start_time=game_start_time,
                league="nba",
            )

            update_cols = {
                col: stmt.excluded[col]
                for col in [
                    "line",
                    "raw_game_id",
                    "player_id",
                    "stat",
                    "game_start_time",
                    "league",
                ]
            }

            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            conn.execute(stmt)
    except Exception as e:
        print(f"⚠️ There was an error inserting the prop, {e}")
        sys.exit(1)


def main():
    # start timing the execution
    start = time()

    test_date = None
    if len(sys.argv) == 2:
        test_date = sys.argv[1]

    # we are gonna have a data structure with player and basic game data for future lookups
    print(f"Currently getting games for {'today' if test_date is None else test_date}")

    todays_games = get_today_games(test_date=test_date)

    print(
        f"Finished getting games for {'today' if test_date is None else test_date} ✅\n"
    )

    player_data_list: list[PlayerData] = []
    team_games_cache: dict[str, list[NbaGame]] = {}

    total_props_generated = 0

    regular_season_only = True

    for i, today_game in enumerate(todays_games):
        game_type = get_game_type(today_game["gameId"])
        if regular_season_only == True and game_type == "playoffs":
            regular_season_only = False

        if game_type == "all_star":
            print("🚨 Skipping this game because its an all start game\n")
            continue

        print(
            f"Getting initial game data for game {today_game['gameId']} {i + 1}/{len(todays_games)}\n"
        )
        home_team_id = today_game["homeTeam"]["teamId"]
        away_team_id = today_game["awayTeam"]["teamId"]

        home_team_players = get_players_from_team(home_team_id)
        away_team_players = get_players_from_team(away_team_id)
        all_game_players = home_team_players + away_team_players

        for player in all_game_players:
            player_last_games = get_player_last_games(player["id"])

            if player_last_games == None:
                continue

            matchup = ""
            if player["team_id"] == home_team_id:
                matchup = away_team_id
            else:
                matchup = home_team_id

            player_data_list.append(
                {
                    "matchup": matchup,
                    "player": player,
                    "game_id": today_game["gameId"],
                    "last_games": player_last_games,
                    "game_start_time": today_game["gameDateTimeUTC"],
                }
            )

    # we now have our whole list of players who at a baseline are eligible for prop ceration
    for player_data in player_data_list:
        player = player_data["player"]
        print(
            f"Processing player {player['name']} {player['id']} against team {player_data['matchup']}\n"
        )

        # we get the last n games for the opposing team
        if player_data["matchup"] not in team_games_cache:
            team_games_cache[player_data["matchup"]] = get_team_last_games(
                player_data["matchup"]
            )
        matchup_last_games = team_games_cache[player_data["matchup"]]

        # we get full team stats for the player's last n games
        # we use the get games by id function to make sure we aren't getting games the player didn't play in

        games_id_list = [game["game_id"] for game in player_data["last_games"]]

        team_last_games = get_games_by_id(games_id_list)

        team_opp_games = get_opposing_team_games_for_games(games_id_list)

        # Calculate means for all stats
        stat_means = {}
        for stat in ["pts", "reb", "ast", "three_pm", "blk", "stl", "tov"]:
            stat_means[stat] = np.mean(
                [game[stat] for game in player_data["last_games"]]
            )

        # Calculate combined stat means
        stat_means["pra"] = np.mean(
            [
                game["pts"] + game["ast"] + game["reb"]
                for game in player_data["last_games"]
            ]
        )
        stat_means["reb_ast"] = np.mean(
            [game["reb"] + game["ast"] for game in player_data["last_games"]]
        )
        stat_means["pts_ast"] = np.mean(
            [game["pts"] + game["ast"] for game in player_data["last_games"]]
        )

        # Get minutes per game
        mpg = np.mean([game["min"] for game in player_data["last_games"]])

        # Check eligibility for each stat
        stat_eligibility = {}
        for stat in ["pts", "reb", "ast", "three_pm", "blk", "stl", "tov"]:
            stat_eligibility[stat] = is_prop_eligible(
                stat,
                stat_means[stat],
                player["position"],
                mpg,
                use_playoffs=(not regular_season_only),
            )

        # Check combined stat eligibility
        for combined_stat in ["pra", "reb_ast", "pts_ast"]:
            stat_eligibility[combined_stat] = is_combined_stat_prop_eligible(
                combined_stat,
                stat_means[combined_stat],
                player["position"],
                mpg,
                use_playoffs=(not regular_season_only),
            )

        # Skip if no props are eligible
        if not any(stat_eligibility.values()):
            print(
                f"🚨 Skipping player {player['name']}, {player['id']}. Not eligible by stats but passed minutes threshold.\n"
            )
            continue

        # Generate props using the stats_arr
        generated_props = {}

        # Generate individual stat props
        for stat in stats_arr:
            if stat in ["pra", "reb_ast", "pts_ast"]:
                continue  # Handle combined stats separately

            if stat_eligibility[stat]:
                line = generate_prop(
                    stat,
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
                if line > 0:
                    generated_props[stat] = line
                    insert_prop(
                        line,
                        player_data["game_id"],
                        player["id"],
                        stat,
                        player_data["game_start_time"],
                    )
                    total_props_generated += 1

        # Generate combined stat props
        if stat_eligibility["pra"]:
            if "pts" not in generated_props:
                generated_props["pts"] = generate_prop(
                    "pts",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            if "reb" not in generated_props:
                generated_props["reb"] = generate_prop(
                    "reb",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            if "ast" not in generated_props:
                generated_props["ast"] = generate_prop(
                    "ast",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            pra_line = round_prop(
                generated_props["pts"] + generated_props["reb"] + generated_props["ast"]
            )
            if pra_line > 0:
                insert_prop(
                    pra_line,
                    player_data["game_id"],
                    player["id"],
                    "pra",
                    player_data["game_start_time"],
                )
                total_props_generated += 1

        if stat_eligibility["pts_ast"]:
            if "pts" not in generated_props:
                generated_props["pts"] = generate_prop(
                    "pts",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            if "ast" not in generated_props:
                generated_props["ast"] = generate_prop(
                    "ast",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            pts_ast_line = round_prop(generated_props["pts"] + generated_props["ast"])
            if pts_ast_line > 0:
                insert_prop(
                    pts_ast_line,
                    player_data["game_id"],
                    player["id"],
                    "pts_ast",
                    player_data["game_start_time"],
                )
                total_props_generated += 1

        if stat_eligibility["reb_ast"]:
            if "reb" not in generated_props:
                generated_props["reb"] = generate_prop(
                    "reb",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            if "ast" not in generated_props:
                generated_props["ast"] = generate_prop(
                    "ast",
                    player_data["last_games"],
                    matchup_last_games,
                    team_last_games,
                    team_opp_games,
                )
            reb_ast_line = round_prop(generated_props["reb"] + generated_props["ast"])
            if reb_ast_line > 0:
                insert_prop(
                    reb_ast_line,
                    player_data["game_id"],
                    player["id"],
                    "reb_ast",
                    player_data["game_start_time"],
                )
                total_props_generated += 1

    end = time()
    print(
        f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
    )

    engine.dispose()


if __name__ == "__main__":
    main()
