import os
import time
from nba_api.live.nba.endpoints import ScoreBoard
from dotenv import load_dotenv
from sqlalchemy import create_engine, select, or_, insert
from tables import nba_player_stats, nba_games, nba_players, nba_props
from datetime import datetime
from utils import get_current_season, get_last_season, db_response_to_json
import random
from my_types import (
    MetricStats,
    NbaGame,
    NbaPlayerStats,
    NbaPlayer,
    StatType,
    PlayerData,
    CombinedStatType,
)
import sys
from constants import constants
from time import time
from sklearn.linear_model import LinearRegression
import pandas as pd
import numpy as np

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

minutes_threshold = 10  # how many minutes a player must average in last n_games games to be considered for a prop
n_games = 15  # number of games to analyze
sigma_coeff = 0.8


# gets all the games for today
def get_today_games(test_games=False):
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        scoreboard = ScoreBoard()
        games = ScoreBoard().games.get_dict()
        if not test_games:
            if scoreboard.score_board_date != today:
                print("No games found today, no props to generate!")
                sys.exit(0)
        return games
    except Exception as e:
        print(f"⚠️ Error fetching today's games: {e}")
        sys.exit(1)


# get a list of all the player_ids from a team
def get_players_from_team(team_id: str) -> list[NbaPlayer]:
    try:
        with engine.connect() as conn:
            stmt = select(nba_players).where(
                nba_players.c.team_id == str(team_id),
            )
            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ Error fetching roster for team {team_id}: {e}")
        sys.exit(1)


def get_games_by_id(id_list: list[str], regular_season_only=True) -> list[NbaGame]:
    try:
        with engine.connect() as conn:
            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_games)
                .where(nba_games.c.id.in_(id_list))
                .where(or_(*conditions))
                .order_by(nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"There was an error fetching games by id, {e}")
        sys.exit(1)


# gets the last n_games games for a team
def get_team_last_games(
    team_id: str, regular_season_only=True
) -> list[NbaGame] | list[str]:
    try:
        with engine.connect() as conn:
            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_games)
                .where(nba_games.c.team_id == str(team_id))
                .where(or_(*conditions))
                .order_by(nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)
            return last_games
    except Exception as e:
        print(f"⚠️  There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)


def get_game(game_id: str) -> NbaGame:
    try:
        with engine.connect() as conn:
            stmt = select(nba_games).where(game_id == game_id)

            result = conn.execute(stmt).first()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching game {game_id}, {e}")


# returns a players last n_games games if they are eligible for a prop
def get_player_last_games(
    player_id, regular_season_only=True
) -> list[NbaPlayerStats] | None:
    try:
        with engine.connect() as conn:
            j = nba_player_stats.join(
                nba_games, nba_player_stats.c.game_id == nba_games.c.id
            )

            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_player_stats)
                .select_from(j)
                .where(or_(*conditions))
                .where(nba_player_stats.c.player_id == str(player_id))
                .order_by(nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            # if no games were found or
            # the player didn't play enough out of the teams last n games
            # or the player doesn't average enough minutes we return null to skip this player

            if (
                len(last_games) != n_games
                or sum(game["min"] for game in last_games) / len(last_games)
                < minutes_threshold
            ):
                return None
            else:
                return last_games

    except Exception as e:
        print(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


# gets the league mean and standard deviation of a specific stat
def get_metric_stats(metric: str, position: str) -> MetricStats:
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
            return {"mean": np.mean(stats), "sd": np.std(stats)}
        except Exception as e:
            print(
                f"⚠️ Error getting stats for metric {metric} for the {get_current_season()} season, {e}"
            )
            sys.exit(1)


# gets the league mean and standard deviation of combined metrics
def get_combined_metric_stats(metric_list: list[str], position: str) -> MetricStats:
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
            return {
                "mean": np.mean(combined_values),
                "sd": np.std(combined_values),
            }

    except Exception as e:
        print(
            f"⚠️ Error getting stats for metrics {metric_list} for the {get_current_season()} season, {e}"
        )
        sys.exit(1)


# Determines if a player is eligible for a prop on a certain stat
def is_prop_eligible(stat_type: StatType, player_stat: float, position: str) -> bool:
    stat_desc = get_metric_stats(stat_type, position)
    if player_stat >= stat_desc["mean"] + constants[stat_type]["standard"]:
        return True
    else:
        rand_thresh = (
            stat_desc["mean"]
            - constants[stat_type]["fallback"]
            + random.gauss(0, sigma_coeff * constants[stat_type]["fallback"])
        )
        return player_stat >= rand_thresh


# checks if a player is eligible for a prop generation for a combined metric
def is_combined_stat_prop_eligible(
    stat_type: CombinedStatType, player_stat: float, position: str
) -> bool:
    combined_metric_list: list[str] = []
    if stat_type == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat_type == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat_type == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(combined_metric_list, position)
    if player_stat >= stat_desc["mean"] + constants[stat_type]["standard"]:
        return True
    else:
        rand_thresh = (
            stat_desc["mean"]
            - constants[stat_type]["fallback"]
            + random.gauss(0, sigma_coeff * constants[stat_type]["fallback"])
        )
        return player_stat >= rand_thresh


# we using the normal distribution and truncate the max sigma * sigma
# this gives us a random value (- sigma * max_sigma, + sigma * max_sigma) with values
# close to the mean much more likely
def generate_prop_truncated_gaussian(
    mean: float, std_dev: float, max_sigma: float = 0.5, round_to: float = 0.5
):
    while True:
        sample = random.gauss(mean, std_dev)
        if abs(sample - mean) <= max_sigma * std_dev:
            return round(round(sample / round_to) * round_to, 1)


# generates a prop for pts
def generate_pts_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
            "fga": [game["fga"] for game in last_games],
            "three_pa": [game["three_pa"] for game in last_games],
            "true_shooting": [game["true_shooting"] for game in last_games],
            "pace": [game["pace"] for game in team_last_games],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
            "team_off_rating": [game["def_rating"] for game in team_last_games],
            "pts": [game["pts"] for game in last_games],
        }
    )

    x_values = data[
        [
            "mpg",
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
    final_prop = generate_prop_truncated_gaussian(predicted_pts, sd)
    return final_prop


# generates a prop for rebounds
def generate_reb_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
):
    if len(last_games) != len(matchup_last_games):
        print(len(last_games), len(matchup_last_games))

    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
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
        ["mpg", "reb_pct", "dreb_pct", "oreb_pct", "opp_fg_pct", "opp_pace"]
    ]
    y_values = data["reb"]

    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_reb = model.predict(next_game_features)[0]
    sd = np.std(data["reb"], ddof=1)
    final_prop = generate_prop_truncated_gaussian(predicted_reb, sd)
    return final_prop


# generates a prop for assists
def generate_ast_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
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
            "mpg",
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
    final_prop = generate_prop_truncated_gaussian(predicted_ast, sd)
    return final_prop


# generates a prop for three pointers made
def generate_three_pm_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
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
            "mpg",
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
    final_prop = generate_prop_truncated_gaussian(predicted_three_pm, sd)
    return final_prop


# generates a prop for blocks
def generate_blk_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
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
        ["mpg", "pct_blk_a", "opp_pace", "opp_off_rating", "team_def_rating"]
    ]
    y_values = data["blk"]
    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_blk = model.predict(next_game_features)[0]
    sd = np.std(data["blk"], ddof=1)
    final_prop = generate_prop_truncated_gaussian(predicted_blk, sd)
    return final_prop


# generates a prop for steals
def generate_stl_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
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
            "mpg",
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
    final_prop = generate_prop_truncated_gaussian(predicted_stl, sd)
    return final_prop


# generates a prop for turnovers
def generate_tov_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
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
            "mpg",
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
    final_prop = generate_prop_truncated_gaussian(predicted_tov, sd)
    return final_prop


# generates a prop for PRA (points + rebounds + assists)
def generate_pra_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
            "fga": [game["fga"] for game in last_games],
            "three_pa": [game["three_pa"] for game in last_games],
            "true_shooting": [game["true_shooting"] for game in last_games],
            "pace": [game["pace"] for game in team_last_games],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
            "team_off_rating": [game["def_rating"] for game in team_last_games],
            "reb_pct": [game["reb_pct"] for game in last_games],
            "dreb_pct": [game["dreb_pct"] for game in last_games],
            "oreb_pct": [game["oreb_pct"] for game in last_games],
            "opp_fg_pct": [
                0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                for game in matchup_last_games
            ],
            "opp_pace": [game["pace"] for game in matchup_last_games],
            "ast_pct": [game["ast_pct"] for game in last_games],
            "ast_ratio": [game["ast_ratio"] for game in last_games],
            "team_fg_pct": [
                0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                for game in team_last_games
            ],
            "pra": [game["pts"] + game["reb"] + game["ast"] for game in last_games],
        }
    )

    x_values = data[
        [
            "mpg",
            "fga",
            "three_pa",
            "true_shooting",
            "pace",
            "usage_rate",
            "opp_def_rating",
            "team_off_rating",
            "reb_pct",
            "dreb_pct",
            "oreb_pct",
            "opp_fg_pct",
            "opp_pace",
            "ast_pct",
            "ast_ratio",
            "team_fg_pct",
        ]
    ]
    y_values = data["pra"]
    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_pra = model.predict(next_game_features)[0]
    sd = np.std(data["pra"], ddof=1)
    final_prop = generate_prop_truncated_gaussian(predicted_pra, sd)
    return final_prop


def generate_pts_ast_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
            "fga": [game["fga"] for game in last_games],
            "three_pa": [game["three_pa"] for game in last_games],
            "true_shooting": [game["true_shooting"] for game in last_games],
            "pace": [game["pace"] for game in team_last_games],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
            "team_off_rating": [game["def_rating"] for game in team_last_games],
            "ast_pct": [game["ast_pct"] for game in last_games],
            "ast_ratio": [game["ast_ratio"] for game in last_games],
            "team_fg_pct": [
                0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                for game in team_last_games
            ],
            "pts_ast": [game["ast"] + game["pts"] for game in last_games],
        }
    )

    x_values = data[
        [
            "mpg",
            "fga",
            "three_pa",
            "true_shooting",
            "pace",
            "usage_rate",
            "opp_def_rating",
            "team_off_rating",
            "ast_pct",
            "ast_ratio",
            "team_fg_pct",
        ]
    ]
    y_values = data["pts_ast"]
    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_pts_ast = model.predict(next_game_features)[0]
    sd = np.std(data["pts_ast"], ddof=1)
    final_prop = generate_prop_truncated_gaussian(predicted_pts_ast, sd)
    return final_prop


def generate_reb_ast_prop(
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGame],
    team_last_games: list[NbaGame],
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
            "ast_pct": [game["ast_pct"] for game in last_games],
            "ast_ratio": [game["ast_ratio"] for game in last_games],
            "team_fg_pct": [
                0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                for game in team_last_games
            ],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "team_off_rating": [game["off_rating"] for game in team_last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
            "reb_pct": [game["reb_pct"] for game in last_games],
            "dreb_pct": [game["dreb_pct"] for game in last_games],
            "oreb_pct": [game["oreb_pct"] for game in last_games],
            "opp_fg_pct": [
                0 if game["fga"] == 0 else (game["fgm"] / game["fga"]) * 100
                for game in matchup_last_games
            ],
            "opp_pace": [game["pace"] for game in matchup_last_games],
            "reb_ast": [game["reb"] + game["ast"] for game in last_games],
        }
    )

    x_values = data[
        [
            "mpg",
            "ast_pct",
            "ast_ratio",
            "team_fg_pct",
            "usage_rate",
            "team_off_rating",
            "opp_def_rating",
            "reb_pct",
            "dreb_pct",
            "oreb_pct",
            "opp_fg_pct",
            "opp_pace",
        ]
    ]
    y_values = data["reb_ast"]
    model = LinearRegression().fit(x_values, y_values)
    next_game_features = pd.DataFrame([x_values.mean()])
    predicted_reb_ast = model.predict(next_game_features)[0]
    sd = np.std(data["reb_ast"], ddof=1)
    final_prop = generate_prop_truncated_gaussian(predicted_reb_ast, sd)
    return final_prop


# inserts a prop into the database
def insert_prop(
    line: float, game_id: str, player_id: str, stat_type: str, game_start_time: datetime
):
    try:
        with engine.begin() as conn:
            stmt = insert(nba_props).values(
                line=line,
                raw_game_id=game_id,
                player_id=player_id,
                stat_type=stat_type,
                game_start_time=game_start_time,
                current_value=0,
            )
            conn.execute(stmt)
            print(f"🎰 Successfully generated prop for {stat_type} at line {line}\n")
    except Exception as e:
        print(f"⚠️ There was an error inserting the prop, {e}")
        sys.exit(1)


def main():
    # start timing the execution
    start = time()

    test = False
    if len(sys.argv) == 2 and sys.argv[1] == "test":
        test = True

    # we are gonna have a data structure with player and basic game data for future lookups
    print("Currently getting today's games")
    games = get_today_games(test_games=test)
    print("Finished getting today's games ✅\n")
    player_data_list: list[PlayerData] = []

    total_props_generated = 0

    for i, game in enumerate(games):
        print(f"Processing for game {game['gameId']} {i + 1}/{len(games)}\n")
        home_team_id = game["homeTeam"]["teamId"]
        away_team_id = game["awayTeam"]["teamId"]

        home_team_players = get_players_from_team(home_team_id)
        away_team_players = get_players_from_team(away_team_id)
        all_game_players = home_team_players + away_team_players

        print(f"We found {len(all_game_players)} players for the game")

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
                    "game_id": game["gameId"],
                    "last_games": player_last_games,
                    "game_start_time": game["gameTimeUTC"],
                }
            )
        print(f"Finished processing players from game {game['gameId']} ✅\n")

    # we now have our whole list of players who at a baseline are eligible for prop ceration
    for player_data in player_data_list:
        print(
            f"Processing player {player['name']} against team {player_data['matchup']}\n"
        )
        player = player_data["player"]

        # first we get all the mu's we need

        mu_pts = np.mean([game["pts"] for game in player_data["last_games"]])
        mu_reb = np.mean([game["reb"] for game in player_data["last_games"]])
        mu_ast = np.mean([game["ast"] for game in player_data["last_games"]])
        mu_three_pm = np.mean([game["three_pm"] for game in player_data["last_games"]])
        mu_blk = np.mean([game["blk"] for game in player_data["last_games"]])
        mu_stl = np.mean([game["stl"] for game in player_data["last_games"]])
        mu_tov = np.mean([game["tov"] for game in player_data["last_games"]])
        mu_pra = np.mean(
            [
                game["pts"] + game["ast"] + game["reb"]
                for game in player_data["last_games"]
            ]
        )
        mu_reb_ast = np.mean(
            [game["reb"] + game["ast"] for game in player_data["last_games"]]
        )
        mu_pts_ast = np.mean(
            [game["pts"] + game["ast"] for game in player_data["last_games"]]
        )

        # then we get the booleans for eligiblity

        pts_prop_eligible = is_prop_eligible("pts", mu_pts, player["position"])
        reb_prop_eligible = is_prop_eligible("reb", mu_reb, player["position"])
        ast_prop_eligible = is_prop_eligible("ast", mu_ast, player["position"])
        three_pm_prop_eligible = is_prop_eligible(
            "three_pm", mu_three_pm, player["position"]
        )
        blk_prop_eligible = is_prop_eligible("blk", mu_blk, player["position"])
        stl_prop_eligible = is_prop_eligible("stl", mu_stl, player["position"])
        tov_prop_eligible = is_prop_eligible("tov", mu_tov, player["position"])
        pra_prop_eligible = is_combined_stat_prop_eligible(
            "pra", mu_pra, player["position"]
        )
        reb_ast_prop_eligible = is_combined_stat_prop_eligible(
            "reb_ast", mu_reb_ast, player["position"]
        )
        pts_ast_prop_eligible = is_combined_stat_prop_eligible(
            "pts_ast", mu_pts_ast, player["position"]
        )

        # we just continue and don't do anymore intensive processing if no props are needed to be created
        if (
            not pts_prop_eligible
            and not reb_prop_eligible
            and not ast_prop_eligible
            and not three_pm_prop_eligible
            and not blk_prop_eligible
            and not stl_prop_eligible
            and not tov_prop_eligible
            and not pra_prop_eligible
            and not reb_ast_prop_eligible
            and not pts_ast_prop_eligible
        ):
            continue

        # we get the last n games for the opposing team
        matchup_last_games = get_team_last_games(player_data["matchup"])

        # we get full team stats for the player's last n games
        # we use the get games by id function to make sure we aren't getting games the player didn't play in

        team_last_games = get_games_by_id(
            [game["game_id"] for game in player_data["last_games"]]
        )

        # check for prop eligibility and if so insert

        if pts_ast_prop_eligible:
            pts_line = generate_pts_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                pts_line,
                player_data["game_id"],
                player["id"],
                "pts",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if reb_prop_eligible:
            reb_line = generate_reb_prop(player_data["last_games"], matchup_last_games)
            insert_prop(
                reb_line,
                player_data["game_id"],
                player["id"],
                "reb",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if ast_prop_eligible:
            ast_line = generate_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                ast_line,
                player_data["game_id"],
                player["id"],
                "ast",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if three_pm_prop_eligible:
            three_pm_line = generate_three_pm_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                three_pm_line,
                player_data["game_id"],
                player["id"],
                "three_pm",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if blk_prop_eligible:
            blk_line = generate_blk_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                blk_line,
                player_data["game_id"],
                player["id"],
                "blk",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if stl_prop_eligible:
            stl_line = generate_stl_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                stl_line,
                player_data["game_id"],
                player["id"],
                "stl",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if tov_prop_eligible:
            tov_line = generate_tov_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                tov_line,
                player_data["game_id"],
                player["id"],
                "tov",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if pra_prop_eligible:
            pra_line = generate_pra_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                pra_line,
                player_data["game_id"],
                player["id"],
                "pra",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if pts_ast_prop_eligible:
            pts_ast_line = generate_pts_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                pts_ast_line,
                player_data["game_id"],
                player["id"],
                "pts_ast",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if reb_ast_prop_eligible:
            reb_ast_line = generate_reb_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
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
