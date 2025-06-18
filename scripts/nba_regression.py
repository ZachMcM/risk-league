import numpy as np
import pandas as pd
from constants import (bias_gaussian_mean, bias_gaussian_sd, bias_lower_bound,
                       bias_upper_bound)
from nba_types import NbaGame, NbaPlayerStats
from sklearn.linear_model import LinearRegression


# rounds props to 0.5
def round_prop(line) -> float:
    return round(round(line / 0.5) * 0.5, 1)


def get_bias() -> float:
    bias = np.random.normal(bias_gaussian_mean, bias_gaussian_sd)
    bias = np.clip(bias, bias_lower_bound, bias_upper_bound)
    return bias


# generates a prop for pts
def generate_pts_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
) -> float:
    data = pd.DataFrame(
        {
            "min": [game["min"] for game in last_games],
            "fga": [game["fga"] for game in last_games],
            "three_pa": [game["three_pa"] for game in last_games],
            "true_shooting": [game["true_shooting"] for game in last_games],
            "pace": [game["pace"] for game in team_last_games],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
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

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_pts = model.predict(next_game_features)[0]
    sd = np.std(data["pts"], ddof=1)
    bias = get_bias()
    final_prop = predicted_pts + bias * sd
    return round_prop(final_prop)


# generates a prop for rebounds
def generate_reb_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
) -> float:
    data = pd.DataFrame(
        {
            "min": [game["min"] for game in last_games],
            "reb_pct": [game["reb_pct"] for game in last_games],
            "dreb_pct": [game["dreb_pct"] for game in last_games],
            "oreb_pct": [game["oreb_pct"] for game in last_games],
            "opp_fg_pct": [
                0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                for game in matchup_last_games
            ],
            "opp_pace": [game["pace"] for game in matchup_last_games],
            "reb": [game["reb"] for game in last_games],
        }
    )

    x_values = data[
        ["min", "reb_pct", "dreb_pct", "oreb_pct", "opp_fg_pct", "opp_pace"]
    ]
    y_values = data["reb"]

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_reb = model.predict(next_game_features)[0]
    sd = np.std(data["reb"], ddof=1)
    bias = get_bias()
    final_prop = predicted_reb + bias * sd
    return round_prop(final_prop)


# generates a prop for assists
def generate_ast_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
) -> float:
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
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
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

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_ast = model.predict(next_game_features)[0]
    sd = np.std(data["ast"], ddof=1)
    bias = get_bias()
    final_prop = predicted_ast + bias * sd
    return round_prop(final_prop)


# generates a prop for three pointers made
def generate_three_pm_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
) -> float:
    data = pd.DataFrame(
        {
            "min": [game["min"] for game in last_games],
            "team_off_rating": [game["off_rating"] for game in team_last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
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

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_three_pm = model.predict(next_game_features)[0]
    sd = np.std(data["three_pm"], ddof=1)
    bias = get_bias()
    final_prop = predicted_three_pm + bias * sd
    return round_prop(final_prop)


# generates a prop for blocks
def generate_blk_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
) -> float:
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
            "opp_pace": [game["pace"] for game in matchup_last_games],
            "opp_off_rating": [game["off_rating"] for game in matchup_last_games],
            "team_def_rating": [game["def_rating"] for game in team_last_games],
            "blk": [game["blk"] for game in last_games],
        }
    )

    x_values = data[
        ["min", "pct_blk_a", "opp_pace", "opp_off_rating", "team_def_rating"]
    ]
    y_values = data["blk"]
    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_blk = model.predict(next_game_features)[0]
    sd = np.std(data["blk"], ddof=1)
    bias = get_bias()
    final_prop = predicted_blk + bias * sd
    return round_prop(final_prop)


# generates a prop for steals
def generate_stl_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
) -> float:
    data = pd.DataFrame(
        {
            "min": [game["min"] for game in last_games],
            "team_def_rating": [game["def_rating"] for game in team_last_games],
            "opp_off_rating": [game["off_rating"] for game in matchup_last_games],
            "opp_pace": [game["pace"] for game in matchup_last_games],
            "pct_stl_a": [
                (
                    0
                    if team_last_games[i]["stl"] == 0
                    else (game["stl"] / team_last_games[i]["stl"]) * 100
                )
                for i, game in enumerate(last_games)
            ],
            "opp_tov": [game["tov"] for game in matchup_last_games],
            "opp_tov_ratio": [game["tov_ratio"] for game in matchup_last_games],
            "opp_tov_pct": [game["tov_pct"] for game in matchup_last_games],
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

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_stl = model.predict(next_game_features)[0]
    sd = np.std(data["stl"], ddof=1)
    bias = get_bias()
    final_prop = predicted_stl + bias * sd
    return round_prop(final_prop)


# generates a prop for turnovers
def generate_tov_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
) -> float:
    data = pd.DataFrame(
        {
            "min": [game["min"] for game in last_games],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "team_off_rating": [game["off_rating"] for game in team_last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
            "tov_ratio": [game["tov_ratio"] for game in last_games],
            "opp_stl": [game["stl"] for game in matchup_last_games],
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

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_tov = model.predict(next_game_features)[0]
    sd = np.std(data["tov"], ddof=1)
    bias = get_bias()
    final_prop = predicted_tov + bias * sd
    return round_prop(final_prop)
