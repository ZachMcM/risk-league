import sys
from datetime import datetime
from time import time
from typing import Any

import numpy as np
import pandas as pd
import requests
from sklearn.linear_model import PoissonRegressor, Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from sqlalchemy import or_, select

from nba.my_types import CombinedStat, PlayerData, Stat, stats_arr
from nba.constants import min_num_stats, minutes_threshold, n_games, sigma_coeff
from shared.constants import bias
from nba.utils import get_current_season, get_game_type, get_last_season
from shared.db_session import get_db_session
from shared.db_utils import (
    get_games_by_id,
    get_opposing_team_last_games,
    get_player_last_games,
    get_players_from_team,
    get_team_last_games,
    insert_prop,
)
from shared.my_types import MetricStats
from shared.tables import NbaGames, NbaPlayerStats, Players
from shared.utils import (
    calculate_weighted_arithmetic_mean,
    round_prop,
)


def generate_prop(
    stat: str,
    last_games: list[NbaPlayerStats],
    matchup_last_games: list[NbaGames],
    team_last_games: list[NbaGames],
    team_opp_games: list[NbaGames],
) -> float:
    """Generate a prop line for a specific NBA stat using machine learning models.
    
    Uses different regression models based on the stat type to predict the player's
    performance in the next game. Incorporates player historical performance,
    team performance, and opponent defensive/offensive metrics.
    
    Args:
        stat: The statistic to generate a prop for (e.g., 'pts', 'reb', 'ast').
        last_games: List of the player's recent game statistics.
        matchup_last_games: List of the opposing team's recent game statistics.
        team_last_games: List of the player's team's recent game statistics.
        team_opp_games: List of statistics from teams that played against the player's team.
        
    Returns:
        The predicted prop line value, adjusted for bias and rounded appropriately.
        
    Raises:
        ValueError: If the stat parameter is not recognized.
    """
    if stat == "pts":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "fga": [game.fga for game in last_games],
                "three_pa": [game.three_pa for game in last_games],
                "true_shooting": [game.true_shooting for game in last_games],
                "pace": [game.pace for game in team_last_games],
                "usage_rate": [game.usage_rate for game in last_games],
                "opp_def_rating": [game.def_rating for game in team_opp_games],
                "team_off_rating": [game.off_rating for game in team_last_games],
                "pts": [game.pts for game in last_games],
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

        next_game_inputs = pd.DataFrame(
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
                        [game.def_rating for game in matchup_last_games]
                    ),
                    "team_off_rating": calculate_weighted_arithmetic_mean(
                        data["team_off_rating"]
                    ),
                }
            ]
        )
        sd = np.std(data["pts"], ddof=1)

    elif stat == "reb":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "reb_pct": [game.reb_pct for game in last_games],
                "dreb_pct": [game.dreb_pct for game in last_games],
                "oreb_pct": [game.oreb_pct for game in last_games],
                "opp_fg_pct": [
                    0 if game.fga == 0 else (game.fgm / game.fga) * 100
                    for game in team_opp_games
                ],
                "opp_pace": [game.pace for game in team_opp_games],
                "reb": [game.reb for game in last_games],
            }
        )
        x_values = data[
            ["min", "reb_pct", "dreb_pct", "oreb_pct", "opp_fg_pct", "opp_pace"]
        ]
        y_values = data["reb"]

        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)

        next_game_inputs = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "reb_pct": calculate_weighted_arithmetic_mean(data["reb_pct"]),
                    "dreb_pct": calculate_weighted_arithmetic_mean(data["dreb_pct"]),
                    "oreb_pct": calculate_weighted_arithmetic_mean(data["oreb_pct"]),
                    "opp_fg_pct": calculate_weighted_arithmetic_mean(
                        [
                            0 if game.fga == 0 else (game.fgm / game.fga) * 100
                            for game in matchup_last_games
                        ]
                    ),
                    "opp_pace": calculate_weighted_arithmetic_mean(
                        [game.pace for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["reb"], ddof=1)

    elif stat == "ast":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "ast_pct": [game.ast_pct for game in last_games],
                "ast_ratio": [game.ast_ratio for game in last_games],
                "team_fg_pct": [
                    0 if game.fga == 0 else (game.fgm / game.fga) * 100
                    for game in team_last_games
                ],
                "usage_rate": [game.usage_rate for game in last_games],
                "team_off_rating": [game.off_rating for game in team_last_games],
                "opp_def_rating": [game.def_rating for game in team_opp_games],
                "ast": [game.ast for game in last_games],
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
        next_game_inputs = pd.DataFrame(
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
                        [game.def_rating for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["ast"], ddof=1)

    elif stat == "three_pm":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "team_off_rating": [game.off_rating for game in team_last_games],
                "opp_def_rating": [game.def_rating for game in team_opp_games],
                "usage_rate": [game.usage_rate for game in last_games],
                "three_pa": [game.three_pa for game in last_games],
                "three_pct": [
                    (
                        0
                        if game.three_pa == 0
                        else (game.three_pm / game.three_pa) * 100
                    )
                    for game in last_games
                ],
                "three_pm": [game.three_pm for game in last_games],
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
        next_game_inputs = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "team_off_rating": calculate_weighted_arithmetic_mean(
                        data["team_off_rating"]
                    ),
                    "opp_def_rating": calculate_weighted_arithmetic_mean(
                        [game.def_rating for game in matchup_last_games]
                    ),
                    "usage_rate": calculate_weighted_arithmetic_mean(
                        data["usage_rate"]
                    ),
                    "three_pa": calculate_weighted_arithmetic_mean(data["three_pa"]),
                    "three_pct": calculate_weighted_arithmetic_mean(data["three_pct"]),
                }
            ]
        )
        sd = np.std(data["three_pm"], ddof=1)

    elif stat == "blk":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "pct_blk_a": [
                    (
                        0
                        if team_last_games[i].blk == 0
                        else (game.blk / team_last_games[i].blk) * 100
                    )
                    for i, game in enumerate(last_games)
                ],
                "opp_pace": [game.pace for game in team_opp_games],
                "opp_off_rating": [game.off_rating for game in team_opp_games],
                "team_def_rating": [game.def_rating for game in team_last_games],
                "blk": [game.blk for game in last_games],
            }
        )
        x_values = data[
            ["min", "pct_blk_a", "opp_pace", "opp_off_rating", "team_def_rating"]
        ]
        y_values = data["blk"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "pct_blk_a": calculate_weighted_arithmetic_mean(data["pct_blk_a"]),
                    "opp_pace": calculate_weighted_arithmetic_mean(
                        [game.pace for game in matchup_last_games]
                    ),
                    "opp_off_rating": calculate_weighted_arithmetic_mean(
                        [game.off_rating for game in matchup_last_games]
                    ),
                    "team_def_rating": calculate_weighted_arithmetic_mean(
                        data["team_def_rating"]
                    ),
                }
            ]
        )
        sd = np.std(data["blk"], ddof=1)

    elif stat == "stl":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "team_def_rating": [game.def_rating for game in team_last_games],
                "opp_off_rating": [game.off_rating for game in team_opp_games],
                "opp_pace": [game.pace for game in team_opp_games],
                "pct_stl_a": [
                    (
                        0
                        if team_last_games[i].stl == 0
                        else (game.stl / team_last_games[i].stl) * 100
                    )
                    for i, game in enumerate(last_games)
                ],
                "opp_tov": [game.tov for game in team_opp_games],
                "opp_tov_ratio": [game.tov_ratio for game in team_opp_games],
                "opp_tov_pct": [game.tov_pct for game in team_opp_games],
                "stl": [game.stl for game in last_games],
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
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "team_def_rating": calculate_weighted_arithmetic_mean(
                        data["team_def_rating"]
                    ),
                    "opp_off_rating": calculate_weighted_arithmetic_mean(
                        [game.off_rating for game in matchup_last_games]
                    ),
                    "opp_pace": calculate_weighted_arithmetic_mean(
                        [game.pace for game in matchup_last_games]
                    ),
                    "pct_stl_a": calculate_weighted_arithmetic_mean(data["pct_stl_a"]),
                    "opp_tov": calculate_weighted_arithmetic_mean(
                        [game.tov for game in matchup_last_games]
                    ),
                    "opp_tov_ratio": calculate_weighted_arithmetic_mean(
                        [game.tov_ratio for game in matchup_last_games]
                    ),
                    "opp_tov_pct": calculate_weighted_arithmetic_mean(
                        [game.tov_pct for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["stl"], ddof=1)

    elif stat == "tov":
        data = pd.DataFrame(
            {
                "min": [game.min for game in last_games],
                "usage_rate": [game.usage_rate for game in last_games],
                "team_off_rating": [game.off_rating for game in team_last_games],
                "opp_def_rating": [game.def_rating for game in team_opp_games],
                "tov_ratio": [game.tov_ratio for game in last_games],
                "opp_stl": [game.stl for game in team_opp_games],
                "tov": [game.tov for game in last_games],
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
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "min": calculate_weighted_arithmetic_mean(data["min"]),
                    "usage_rate": calculate_weighted_arithmetic_mean(
                        data["usage_rate"]
                    ),
                    "team_off_rating": calculate_weighted_arithmetic_mean(
                        data["team_off_rating"]
                    ),
                    "opp_def_rating": calculate_weighted_arithmetic_mean(
                        [game.def_rating for game in matchup_last_games]
                    ),
                    "tov_ratio": calculate_weighted_arithmetic_mean(data["tov_ratio"]),
                    "opp_stl": calculate_weighted_arithmetic_mean(
                        [game.stl for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["tov"], ddof=1)

    else:
        raise ValueError(f"Unknown stat: {stat}")

    predicted_value = model.predict(next_game_inputs)[0]
    final_prop = predicted_value + bias * sd
    return round_prop(final_prop)


_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


def get_metric_stats(session: Session, metric: str, position: str, use_playoffs: bool) -> MetricStats:
    """Gets the league mean and standard deviation of a specific stat"""
    cache_key = (metric, position)
    if cache_key in _metric_stats_cache:
        return _metric_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        return (
            select(getattr(NbaPlayerStats, metric))
            .select_from(
                NbaPlayerStats.__table__.join(
                    NbaGames.__table__, NbaPlayerStats.game_id == NbaGames.id
                ).join(Players.__table__, NbaPlayerStats.player_id == Players.id)
            )
            .where(*game_type_filter)
            .where(*season_filter)
            .where(NbaPlayerStats.min > 0)
            .where(NbaPlayerStats.player_id.is_not(None))
            .where(Players.position == position)
        )

    try:
        season = get_current_season()

        # Primary filters
        game_type = "playoffs" if use_playoffs else "regular_season"
        stmt = build_stmt(
            [NbaGames.game_type == game_type],
            [NbaPlayerStats.season == season],
        )

        result = session.execute(stmt).fetchall()

        # Fallback if not enough stats
        if len(result) < min_num_stats:
            if use_playoffs:
                # Combine regular and playoffs for current season
                game_type_filter = [
                    or_(
                        NbaGames.game_type == "regular_season",
                        NbaGames.game_type == "playoffs",
                    )
                ]
                season_filter = [NbaPlayerStats.season == season]
            else:
                # Use two seasons for regular season stats
                game_type_filter = [NbaGames.game_type == "regular_season"]
                season_filter = [
                    or_(
                        NbaPlayerStats.season == season,
                        NbaPlayerStats.season == get_last_season(),
                    )
                ]

            stmt = build_stmt(game_type_filter, season_filter)
            result = session.execute(stmt).fetchall()

        stats = [row[0] for row in result]
        metric_stats = {"mean": np.mean(stats), "sd": np.std(stats)}
        _metric_stats_cache[cache_key] = metric_stats
        return metric_stats

    except Exception as e:
        print(
            f"⚠️ Error getting stats for metric {metric} for the {get_current_season()} season, {e}"
        )
        sys.exit(1)


_combined_stats_cache: dict[tuple[tuple[str, ...], str], MetricStats] = {}


def get_combined_metric_stats(
    session: Session, metric_list: list[str], position: str, use_playoffs: bool
) -> MetricStats:
    """gets the league mean and standard deviation of combined metrics"""
    cache_key = (tuple(sorted(metric_list)), position)
    if cache_key in _combined_stats_cache:
        return _combined_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        columns = [getattr(NbaPlayerStats, metric) for metric in metric_list]
        return (
            select(*columns)
            .select_from(
                NbaPlayerStats.__table__.join(
                    NbaGames.__table__, NbaPlayerStats.game_id == NbaGames.id
                ).join(Players.__table__, NbaPlayerStats.player_id == Players.id)
            )
            .where(*game_type_filter)
            .where(*season_filter)
            .where(NbaPlayerStats.min > 0)
            .where(NbaPlayerStats.player_id.is_not(None))
            .where(Players.position == position)
        )

    try:
        season = get_current_season()

        game_type = "playoffs" if use_playoffs else "regular_season"
        stmt = build_stmt(
            [NbaGames.game_type == game_type],
            [NbaPlayerStats.season == season],
        )
        result = session.execute(stmt).fetchall()

        if len(result) < min_num_stats:
            if use_playoffs:
                game_type_filter = [
                    or_(
                        NbaGames.game_type == "regular_season",
                        NbaGames.game_type == "playoffs",
                    )
                ]
                season_filter = [NbaPlayerStats.season == season]
            else:
                game_type_filter = [NbaGames.game_type == "regular_season"]
                season_filter = [
                    or_(
                        NbaPlayerStats.season == season,
                        NbaPlayerStats.season == get_last_season(),
                    )
                ]

            stmt = build_stmt(game_type_filter, season_filter)
            result = session.execute(stmt).fetchall()

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


def is_prop_eligible(
    session: Session,
    stat: Stat,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    """Determine if a player is eligible for a prop on a specific stat.
    
    Checks if the player meets the minimum requirements for prop generation
    based on their average performance, position, and minutes played.
    
    Args:
        session: SQLAlchemy database session
        stat: The statistic to check eligibility for.
        player_stat_average: The player's average performance in this stat.
        position: The player's position (e.g., 'PG', 'SG', 'SF', 'PF', 'C').
        mpg: The player's minutes per game average.
        use_playoffs: Whether to use playoff stats for comparison. Defaults to False.
        
    Returns:
        True if the player is eligible for this prop, False otherwise.
    """
    stat_desc = get_metric_stats(session, stat, position, use_playoffs)
    return (
        mpg > minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )


def is_combined_stat_prop_eligible(
    session: Session,
    stat: CombinedStat,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    """Check if a player is eligible for a combined stat prop.
    
    Evaluates eligibility for combined statistics like PRA (Points + Rebounds + Assists),
    Points + Assists, or Rebounds + Assists based on league averages.
    
    Args:
        session: SQLAlchemy database session
        stat: The combined statistic to check ('pra', 'pts_ast', or 'reb_ast').
        player_stat_average: The player's average performance in this combined stat.
        position: The player's position (e.g., 'PG', 'SG', 'SF', 'PF', 'C').
        mpg: The player's minutes per game average.
        use_playoffs: Whether to use playoff stats for comparison. Defaults to False.
        
    Returns:
        True if the player is eligible for this combined stat prop, False otherwise.
    """
    combined_metric_list: list[str] = []
    if stat == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(session, combined_metric_list, position, use_playoffs)

    return (
        mpg > minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )


def get_today_games(test_date: str = None) -> list[dict[str, Any]]:
    """Fetch NBA games scheduled for today from the NBA API.
    
    Retrieves the complete schedule and filters for games on the current date
    or a specified test date.
    
    Args:
        test_date: Optional test date in MM/DD/YYYY format. If None, uses today's date.
        
    Returns:
        List of games scheduled for the specified date, or empty list if no games.
    """
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


def main() -> None:
    """Main function to generate NBA props for today's games.
    
    Orchestrates the entire prop generation process:
    1. Fetches today's NBA games
    2. Processes each player in each game
    3. Checks eligibility for various stats
    4. Generates prop lines using machine learning models
    5. Stores props in the database
    
    Supports a test_date command line argument for historical analysis.
    """
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

    session = get_db_session()
    try:
        player_data_list: list[PlayerData] = []
        team_games_cache: dict[str, list[NbaGames]] = {}

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

            home_team_players = get_players_from_team(session, home_team_id)
            away_team_players = get_players_from_team(session, away_team_id)
            all_game_players = home_team_players + away_team_players

            for player in all_game_players:
                player_last_games = get_player_last_games(
                    session, player.id, "nba", n_games
                )

                if len(player_last_games) != n_games:
                    print(f"🚨 Skipping player {player}\n")
                    continue

                matchup = ""
                if player.team_id == home_team_id:
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
                f"Processing player {player.name} {player.id} against team {player_data['matchup']}\n"
            )

            # we get the last n games for the opposing team
            if player_data["matchup"] not in team_games_cache:
                team_games_cache[player_data["matchup"]] = get_team_last_games(
                    session, player_data["matchup"], "nba", n_games
                )
            matchup_last_games = team_games_cache[player_data["matchup"]]

            # we get full team stats for the player's last n games
            # we use the get games by id function to make sure we aren't getting games the player didn't play in

            games_id_list = [game.game_id for game in player_data["last_games"]]

            team_last_games = get_games_by_id(session, games_id_list, "nba", n_games)

            team_opp_games = get_opposing_team_last_games(
                session, games_id_list, "nba", n_games
            )

            # Calculate means for all stats
            stat_means = {}
            for stat in ["pts", "reb", "ast", "three_pm", "blk", "stl", "tov"]:
                stat_means[stat] = np.mean(
                    [getattr(game, stat) for game in player_data["last_games"]]
                )

            # Calculate combined stat means
            stat_means["pra"] = np.mean(
                [
                    game.pts + game.ast + game.reb
                    for game in player_data["last_games"]
                ]
            )
            stat_means["reb_ast"] = np.mean(
                [game.reb + game.ast for game in player_data["last_games"]]
            )
            stat_means["pts_ast"] = np.mean(
                [game.pts + game.ast for game in player_data["last_games"]]
            )

            # Get minutes per game
            mpg = np.mean([game.min for game in player_data["last_games"]])

            # Check eligibility for each stat
            stat_eligibility = {}
            for stat in ["pts", "reb", "ast", "three_pm", "blk", "stl", "tov"]:
                stat_eligibility[stat] = is_prop_eligible(
                    session,
                    stat,
                    stat_means[stat],
                    player.position,
                    mpg,
                    use_playoffs=(not regular_season_only),
                )

            # Check combined stat eligibility
            for combined_stat in ["pra", "reb_ast", "pts_ast"]:
                stat_eligibility[combined_stat] = is_combined_stat_prop_eligible(
                    session,
                    combined_stat,
                    stat_means[combined_stat],
                    player.position,
                    mpg,
                    use_playoffs=(not regular_season_only),
                )

            # Skip if no props are eligible
            if not any(stat_eligibility.values()):
                print(
                    f"🚨 Skipping player {player.name}, {player.id}. Not eligible by stats but passed minutes threshold.\n"
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
                            session,
                            line,
                            str(player_data["game_id"]),
                            player.id,
                            stat,
                            player_data["game_start_time"],
                            "nba"
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
                        session,
                        pra_line,
                        str(player_data["game_id"]),
                        player.id,
                        "pra",
                        player_data["game_start_time"],
                        "nba"
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
                        session,
                        pts_ast_line,
                        str(player_data["game_id"]),
                        player.id,
                        "pts_ast",
                        player_data["game_start_time"],
                        "nba"
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
                        session,
                        reb_ast_line,
                        str(player_data["game_id"]),
                        player.id,
                        "reb_ast",
                        player_data["game_start_time"],
                        "nba"
                    )
                    total_props_generated += 1

        end = time()
        print(
            f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
        )
    finally:
        session.close()


if __name__ == "__main__":
    main()