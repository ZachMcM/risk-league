import os
import time
from nba_api.stats.endpoints import scoreboardv2, leaguegamefinder
from dotenv import load_dotenv
from sqlalchemy import create_engine, select, or_, insert
from tables import nba_player_stats, nba_games, nba_players, nba_teams
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
games_played = 10  # player must be in last 5 of teams 30
sigma_coeff = 0.8


# gets all the games for today
def get_today_games():
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        scoreboard = scoreboardv2.ScoreboardV2(game_date=today)
        games_df = scoreboard.get_data_frames()[0]
        return games_df
    except Exception as e:
        print(f"⚠️ Error fetching today's games: {e}")
        sys.exit(1)


# for testing
def get_test_games():
    games = leaguegamefinder.LeagueGameFinder(
        season_nullable="2024-25",
        league_id_nullable="00",
        date_from_nullable="12/21/2024",
        date_to_nullable="12/21/2024",
    ).get_data_frames()[0]
    return games


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


# gets a team's id from their abbreviation
def get_team_id_by_abrev(abrev: str):
    try:
        with engine.connect() as conn:
            stmt = select(nba_teams.c.id).where(nba_teams.c.abbreviation == abrev)

            return conn.execute(stmt).scalar()
    except Exception as e:
        print(f"⚠️ Error getting team ${abrev} abbreviation, {e}")


def get_games_by_id(id_list: list[str], regular_season_only=True) -> list[NbaGame]:
    try:
        with engine.connect() as conn:
            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_games)
                .where(nba_games.c.id in id_list)
                .where(or_(*conditions))
                .order_by(nba_games.c.game_date)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"There was an error fetching games by id, {e}")
        sys.exit(1)


# gets the last n_games games for a team
def get_team_last_games(
    team_id: str, column_string=None | str, regular_season_only=True
) -> list[NbaGame] | list[str]:
    try:
        with engine.connect() as conn:
            column = (
                nba_games
                if column_string is None
                else getattr(nba_games.c, column_string)
            )

            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(column)
                .where(nba_games.c.team_id == str(team_id))
                .where(or_(*conditions))
                .order_by(nba_games.c.game_date)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result, column_string)
            return last_games
    except Exception as e:
        print(f"⚠️ There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)


def get_game(game_id: str) -> NbaGame:
    try:
        with engine.connect() as conn:
            stmt = select(nba_games).where(game_id == game_id)

            result = conn.execute(stmt).first()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching game {game_id}, {e}")


# returns a players last n_games games if they average more than minutes_threshold minutes and played >= games_played of teams last n_games
def get_player_last_games(
    player_id, team_last_games: list[str], regular_season_only=True
) -> list[NbaPlayerStats]:
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
                .order_by(nba_player_stats.c.updated_at)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            curr_games_played = sum(
                1 for game in last_games if game["id"] in team_last_games
            )

            if (
                len(last_games) == 0
                or curr_games_played >= games_played
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


# generates a prop for pts
def generate_pts_prop(
    last_games: list[NbaPlayerStats], matchup_last_games: list[NbaGame], team_last_games: list[NbaGame]
):
    data = pd.DataFrame(
        {
            "mpg": [game["min"] for game in last_games],
            "fga": [game["fga"] for game in last_games],
            "three_pa": [game["three_pa"] for game in last_games],
            "true_shooting": [game["true_shooting"] for game in last_games],
            "pace": [game['pace'] for game in team_last_games],
            "usage_rate": [game["usage_rate"] for game in last_games],
            "opp_def_rating": [game["def_rating"] for game in matchup_last_games],
            "off_rating": [game['def_rating'] for game in team_last_games],
            "pts": [game["pts"] for game in last_games],
        }
    )
    
    x_values = data[["mpg", "fga", "three_pa", "true_shooting", "pace", "usage_rate", "opp_def_rating", "off_rating"]]
    y_values = data["pts"]
    
    model = LinearRegression().fit(x_values, y_values)
    next_game_features = x_values.mean().to_numpy().reshape(1, -1)
    predicted_pts = model.predict(next_game_features)[0]
    spread = np.std(data['pts'], ddof=1)
    final_prop = round(random.uniform(predicted_pts - spread, predicted_pts + spread), 1)
    # TODO
    

# start timing the execution
start = time()

# we are gonna have a data structure with player and basic game data for future lookups
print("Currently getting test games")
games = get_test_games().to_dict("records")
print("Finished getting test games ✅\n")
player_data_list: list[PlayerData] = []

for i, game in enumerate(games):
    print(f"Processing for game {game['GAME_ID']} {i + 1}/{len(games)}")
    team_id = game["TEAM_ID"]

    players_from_team = get_players_from_team(team_id)

    for player in players_from_team:
        team_last_games = get_team_last_games(team_id, "id")

        player_last_games = get_player_last_games(player["id"], team_last_games)

        if player_last_games == None:
            continue
        player_data_list.append(
            {
                "matchup": game["MATCHUP"][5:],
                "player": player,
                "game_id": game["GAME_ID"],
                "last_games": player_last_games,
            }
        )
    print(f"Finished processing players from game {game['GAME_ID']} ✅\n")

# we now have our whole list of players who at a baseline are eligible for prop ceration
for player_data in player_data_list:
    player = player_data["player"]

    # first we get all the mu's we need

    mu_pts = np.mean(game["pts"] for game in player_data["last_games"])
    mu_reb = np.mean(game["reb"] for game in player_data["last_games"])
    mu_ast = np.mean(game["ast"] for game in player_data["last_games"])
    mu_three_pm = np.mean(
        game["three_pm"] for game in player_data["last_games"]
    )
    mu_blk = np.mean(game["blk"] for game in player_data["last_games"])
    mu_stl = np.mean(game["stl"] for game in player_data["last_games"])
    mu_tov = np.mean(game["tov"] for game in player_data["last_games"])
    mu_pra = np.mean(
        game["pts"] + game["ast"] + game["reb"] for game in player_data["last_games"]
    )
    mu_reb_ast = np.mean(
        game["reb"] + game["ast"] for game in player_data["last_games"]
    )
    mu_pts_ast = np.mean(
        game["pts"] + game["ast"] for game in player_data["last_games"]
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

    matchup_team_id = get_team_id_by_abrev(player_data["matchup"])
    matchup_last_games = get_team_last_games(matchup_team_id)
    team_last_games = get_games_by_id([game['id'] for game in player_data['last_games']])

end = time()
print(f"Script finished executing in {end - start:.2f} seconds")

engine.dispose()
