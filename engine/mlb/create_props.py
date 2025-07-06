import sys
from datetime import datetime
from time import time

import numpy as np
import pandas as pd
import statsapi
from sklearn.linear_model import PoissonRegressor, Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from sqlalchemy import select

from mlb.constants import n_games
from mlb.my_types import PlayerData, Stat, stats_arr
from shared.constants import bias
from shared.db_session import get_db_session
from shared.db_utils import (
    get_games_by_id,
    get_opposing_team_last_games,
    get_player_last_games,
    get_team_last_games,
    insert_prop,
)
from shared.tables import Players, MlbGames, MlbPlayerStats
from shared.utils import (
    calculate_weighted_arithmetic_mean,
    round_prop,
)


def generate_prop(
    stat: Stat,
    last_games: list[MlbPlayerStats],
    matchup_last_games: list[MlbGames],
    team_last_games: list[MlbGames],
    team_opp_last_games: list[MlbGames],
) -> float:
    """Generate a prop line for a specific MLB stat using machine learning models.
    
    Uses different regression models (Ridge or Poisson) based on the stat type
    to predict the player's performance in the next game. Incorporates player
    historical performance, team performance, and opponent metrics.
    
    Args:
        stat: The statistic to generate a prop for (e.g., 'hits', 'home_runs', 'strikeouts').
        last_games: List of the player's recent game statistics.
        matchup_last_games: List of the opposing team's recent game statistics.
        team_last_games: List of the player's team's recent game statistics.
        team_opp_last_games: List of statistics from teams that played against the player's team.
        
    Returns:
        The predicted prop line value, adjusted for bias and rounded appropriately.
        Returns 0 if the prediction is NaN or infinite.
        
    Raises:
        ValueError: If the stat parameter is not recognized.
    """
    if stat == "home_runs":
        data = pd.DataFrame(
            {
                "at_bats": [game.at_bats for game in last_games],
                "slugging_pct": [game.slugging_pct for game in last_games],
                "ops": [game.ops for game in last_games],
                "batting_avg": [game.batting_avg for game in last_games],
                "opp_pitching_home_runs": [
                    game.pitching_home_runs for game in team_opp_last_games
                ],
                "opp_pitching_strikeouts": [
                    game.pitching_strikeouts for game in team_opp_last_games
                ],
                "opp_pitching_walks": [
                    game.pitching_walks for game in team_opp_last_games
                ],
                "home_runs": [game.home_runs for game in last_games],
            }
        )
        x_values = data[
            [
                "at_bats",
                "slugging_pct",
                "ops",
                "batting_avg",
                "opp_pitching_home_runs",
                "opp_pitching_strikeouts",
                "opp_pitching_walks",
            ]
        ]
        y_values = data["home_runs"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)

        next_game_inputs = pd.DataFrame(
            [
                {
                    "at_bats": calculate_weighted_arithmetic_mean(data["at_bats"]),
                    "slugging_pct": calculate_weighted_arithmetic_mean(
                        data["slugging_pct"]
                    ),
                    "ops": calculate_weighted_arithmetic_mean(data["ops"]),
                    "batting_avg": calculate_weighted_arithmetic_mean(
                        data["batting_avg"]
                    ),
                    "opp_pitching_home_runs": calculate_weighted_arithmetic_mean(
                        [game.pitching_home_runs for game in matchup_last_games]
                    ),
                    "opp_pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.pitching_strikeouts for game in matchup_last_games]
                    ),
                    "opp_pitching_walks": calculate_weighted_arithmetic_mean(
                        [game.pitching_walks for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["home_runs"], ddof=1)

    elif stat == "doubles":
        data = pd.DataFrame(
            {
                "hits": [game.hits for game in last_games],
                "at_bats": [game.at_bats for game in last_games],
                "slugging_pct": [game.slugging_pct for game in last_games],
                "ops": [game.ops for game in last_games],
                "batting_avg": [game.batting_avg for game in last_games],
                "opp_pitching_hits": [
                    game.pitching_hits for game in team_opp_last_games
                ],
                "opp_pitching_strikeouts": [
                    game.pitching_strikeouts for game in team_opp_last_games
                ],
                "opp_pitching_walks": [
                    game.pitching_walks for game in team_opp_last_games
                ],
                "doubles": [game.doubles for game in last_games],
            }
        )
        x_values = data[
            [
                "hits",
                "at_bats",
                "slugging_pct",
                "ops",
                "batting_avg",
                "opp_pitching_hits",
                "opp_pitching_strikeouts",
                "opp_pitching_walks",
            ]
        ]
        y_values = data["doubles"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)

        next_game_inputs = pd.DataFrame(
            [
                {
                    "hits": calculate_weighted_arithmetic_mean(data["hits"]),
                    "at_bats": calculate_weighted_arithmetic_mean(data["at_bats"]),
                    "slugging_pct": calculate_weighted_arithmetic_mean(
                        data["slugging_pct"]
                    ),
                    "ops": calculate_weighted_arithmetic_mean(data["ops"]),
                    "batting_avg": calculate_weighted_arithmetic_mean(
                        data["batting_avg"]
                    ),
                    "opp_pitching_hits": calculate_weighted_arithmetic_mean(
                        [game.pitching_hits for game in matchup_last_games]
                    ),
                    "opp_pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.pitching_strikeouts for game in matchup_last_games]
                    ),
                    "opp_pitching_walks": calculate_weighted_arithmetic_mean(
                        [game.pitching_walks for game in matchup_last_games]
                    ),
                }
            ]
        )

        sd = np.std(data["doubles"], ddof=1)

    elif stat == "hits":
        data = pd.DataFrame(
            {
                "at_bats": [game.at_bats for game in last_games],
                "slugging_pct": [game.slugging_pct for game in last_games],
                "ops": [game.ops for game in last_games],
                "batting_avg": [game.batting_avg for game in last_games],
                "opp_pitching_hits": [
                    game.pitching_hits for game in team_opp_last_games
                ],
                "opp_pitching_strikeouts": [
                    game.pitching_strikeouts for game in team_opp_last_games
                ],
                "opp_pitching_walks": [
                    game.pitching_walks for game in team_opp_last_games
                ],
                "hits": [game.hits for game in last_games],
            }
        )
        x_values = data[
            [
                "at_bats",
                "slugging_pct",
                "ops",
                "batting_avg",
                "opp_pitching_hits",
                "opp_pitching_strikeouts",
                "opp_pitching_walks",
            ]
        ]
        y_values = data["hits"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)

        next_game_inputs = pd.DataFrame(
            [
                {
                    "at_bats": calculate_weighted_arithmetic_mean(data["at_bats"]),
                    "slugging_pct": calculate_weighted_arithmetic_mean(
                        data["slugging_pct"]
                    ),
                    "ops": calculate_weighted_arithmetic_mean(data["ops"]),
                    "batting_avg": calculate_weighted_arithmetic_mean(
                        data["batting_avg"]
                    ),
                    "opp_pitching_hits": calculate_weighted_arithmetic_mean(
                        [game.pitching_hits for game in matchup_last_games]
                    ),
                    "opp_pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.pitching_strikeouts for game in matchup_last_games]
                    ),
                    "opp_pitching_walks": calculate_weighted_arithmetic_mean(
                        [game.pitching_walks for game in matchup_last_games]
                    ),
                }
            ]
        )

        sd = np.std(data["hits"], ddof=1)

    elif stat == "triples":
        data = pd.DataFrame(
            {
                "hits": [game.hits for game in last_games],
                "at_bats": [game.at_bats for game in last_games],
                "slugging_pct": [game.slugging_pct for game in last_games],
                "ops": [game.ops for game in last_games],
                "batting_avg": [game.batting_avg for game in last_games],
                "opp_pitching_hits": [
                    game.pitching_hits for game in team_opp_last_games
                ],
                "opp_pitching_strikeouts": [
                    game.pitching_strikeouts for game in team_opp_last_games
                ],
                "opp_pitching_walks": [
                    game.pitching_walks for game in team_opp_last_games
                ],
                "triples": [game.triples for game in last_games],
            }
        )
        x_values = data[
            [
                "hits",
                "at_bats",
                "slugging_pct",
                "ops",
                "batting_avg",
                "opp_pitching_hits",
                "opp_pitching_strikeouts",
                "opp_pitching_walks",
            ]
        ]
        y_values = data["triples"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)

        next_game_inputs = pd.DataFrame(
            [
                {
                    "hits": calculate_weighted_arithmetic_mean(data["hits"]),
                    "at_bats": calculate_weighted_arithmetic_mean(data["at_bats"]),
                    "slugging_pct": calculate_weighted_arithmetic_mean(
                        data["slugging_pct"]
                    ),
                    "ops": calculate_weighted_arithmetic_mean(data["ops"]),
                    "batting_avg": calculate_weighted_arithmetic_mean(
                        data["batting_avg"]
                    ),
                    "opp_pitching_hits": calculate_weighted_arithmetic_mean(
                        [game.pitching_hits for game in matchup_last_games]
                    ),
                    "opp_pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.pitching_strikeouts for game in matchup_last_games]
                    ),
                    "opp_pitching_walks": calculate_weighted_arithmetic_mean(
                        [game.pitching_walks for game in matchup_last_games]
                    ),
                }
            ]
        )

        sd = np.std(data["triples"], ddof=1)

    elif stat == "rbi":
        data = pd.DataFrame(
            {
                "hits": [game.hits for game in last_games],
                "home_runs": [game.home_runs for game in last_games],
                "at_bats": [game.at_bats for game in last_games],
                "slugging_pct": [game.slugging_pct for game in last_games],
                "sac_flies": [game.sac_flies for game in last_games],
                "team_runs": [game.runs for game in team_last_games],
                "opp_pitching_strikeouts": [
                    game.pitching_strikeouts for game in team_opp_last_games
                ],
                "rbi": [game.rbi for game in last_games],
            }
        )
        x_values = data[
            [
                "hits",
                "home_runs",
                "at_bats",
                "slugging_pct",
                "sac_flies",
                "team_runs",
                "opp_pitching_strikeouts",
            ]
        ]
        y_values = data["rbi"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)

        next_game_inputs = pd.DataFrame(
            [
                {
                    "hits": calculate_weighted_arithmetic_mean(data["hits"]),
                    "home_runs": calculate_weighted_arithmetic_mean(data["home_runs"]),
                    "at_bats": calculate_weighted_arithmetic_mean(data["at_bats"]),
                    "slugging_pct": calculate_weighted_arithmetic_mean(
                        data["slugging_pct"]
                    ),
                    "sac_flies": calculate_weighted_arithmetic_mean(data["sac_flies"]),
                    "team_runs": calculate_weighted_arithmetic_mean(data["team_runs"]),
                    "opp_pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.pitching_strikeouts for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["rbi"], ddof=1)

    elif stat == "strikeouts":
        data = pd.DataFrame(
            {
                "at_bats": [game.at_bats for game in last_games],
                "ops": [game.ops for game in last_games],
                "opp_pitching_strikeouts": [
                    game.pitching_strikeouts for game in team_opp_last_games
                ],
                "opp_strikes": [game.strikes for game in team_opp_last_games],
                "opp_pitches_thrown": [
                    game.pitches_thrown for game in team_opp_last_games
                ],
                "opp_pitching_hits": [
                    game.pitching_hits for game in team_opp_last_games
                ],
                "strikeouts": [game.strikeouts for game in last_games],
            }
        )
        x_values = data[
            [
                "at_bats",
                "ops",
                "opp_pitching_strikeouts",
                "opp_strikes",
                "opp_pitches_thrown",
                "opp_pitching_hits",
            ]
        ]
        y_values = data["strikeouts"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "at_bats": calculate_weighted_arithmetic_mean(data["at_bats"]),
                    "ops": calculate_weighted_arithmetic_mean(data["ops"]),
                    "opp_pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.pitching_strikeouts for game in matchup_last_games]
                    ),
                    "opp_strikes": calculate_weighted_arithmetic_mean(
                        [game.strikes for game in matchup_last_games]
                    ),
                    "opp_pitches_thrown": calculate_weighted_arithmetic_mean(
                        [game.pitches_thrown for game in matchup_last_games]
                    ),
                    "opp_pitching_hits": calculate_weighted_arithmetic_mean(
                        [game.pitching_hits for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["strikeouts"], ddof=1)

    elif stat == "pitching_strikeouts":
        data = pd.DataFrame(
            {
                "innings_pitched": [game.innings_pitched for game in last_games],
                "pitches_thrown": [game.pitches_thrown for game in last_games],
                "strikes": [game.strikes for game in last_games],
                "opp_strikeouts": [game.strikeouts for game in team_opp_last_games],
                "opp_batting_avg": [
                    game.batting_avg for game in team_opp_last_games
                ],
                "pitching_strikeouts": [
                    game.pitching_strikeouts for game in last_games
                ],
            }
        )
        x_values = data[
            [
                "innings_pitched",
                "pitches_thrown",
                "strikes",
                "opp_strikeouts",
                "opp_batting_avg",
            ]
        ]
        y_values = data["pitching_strikeouts"]
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "innings_pitched": calculate_weighted_arithmetic_mean(
                        data["innings_pitched"]
                    ),
                    "pitches_thrown": calculate_weighted_arithmetic_mean(
                        data["pitches_thrown"]
                    ),
                    "strikes": calculate_weighted_arithmetic_mean(data["strikes"]),
                    "opp_strikeouts": calculate_weighted_arithmetic_mean(
                        [game.strikeouts for game in matchup_last_games]
                    ),
                    "opp_batting_avg": calculate_weighted_arithmetic_mean(
                        [game.batting_avg for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["pitching_strikeouts"], ddof=1)

    elif stat == "pitches_thrown":
        data = pd.DataFrame(
            {
                "innings_pitched": [game.innings_pitched for game in last_games],
                "pitching_strikeouts": [
                    game.pitching_strikeouts for game in last_games
                ],
                "pitching_walks": [game.pitching_walks for game in last_games],
                "pitching_hits": [game.pitching_hits for game in last_games],
                "opp_ops": [game.ops for game in team_opp_last_games],
                "opp_slugging_pct": [
                    game.slugging_pct for game in team_opp_last_games
                ],
                "opp_runs": [game.runs for game in team_opp_last_games],
                "pitches_thrown": [game.pitches_thrown for game in last_games],
            }
        )
        x_values = data[
            [
                "innings_pitched",
                "pitching_strikeouts",
                "pitching_walks",
                "pitching_hits",
                "opp_ops",
                "opp_slugging_pct",
                "opp_runs",
            ]
        ]
        y_values = data["pitches_thrown"]
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "innings_pitched": calculate_weighted_arithmetic_mean(
                        data["innings_pitched"]
                    ),
                    "pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        data["pitching_strikeouts"]
                    ),
                    "pitching_walks": calculate_weighted_arithmetic_mean(
                        data["pitching_walks"]
                    ),
                    "pitching_hits": calculate_weighted_arithmetic_mean(
                        data["pitching_hits"]
                    ),
                    "opp_ops": calculate_weighted_arithmetic_mean(
                        [game.ops for game in matchup_last_games]
                    ),
                    "opp_slugging_pct": calculate_weighted_arithmetic_mean(
                        [game.slugging_pct for game in matchup_last_games]
                    ),
                    "opp_runs": calculate_weighted_arithmetic_mean(
                        [game.runs for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["pitches_thrown"], ddof=1)

    elif stat == "earned_runs":
        data = pd.DataFrame(
            {
                "innings_pitched": [game.innings_pitched for game in last_games],
                "pitching_hits": [game.pitching_hits for game in last_games],
                "pitching_walks": [game.pitching_walks for game in last_games],
                "pitching_home_runs": [
                    game.pitching_home_runs for game in last_games
                ],
                "opp_runs": [game.runs for game in team_opp_last_games],
                "opp_ops": [game.ops for game in team_opp_last_games],
                "opp_slugging_pct": [
                    game.slugging_pct for game in team_opp_last_games
                ],
                "earned_runs": [game.earned_runs for game in last_games],
            }
        )
        x_values = data[
            [
                "innings_pitched",
                "pitching_hits",
                "pitching_walks",
                "pitching_home_runs",
                "opp_runs",
                "opp_ops",
                "opp_slugging_pct",
            ]
        ]
        y_values = data["earned_runs"]
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "innings_pitched": calculate_weighted_arithmetic_mean(
                        data["innings_pitched"]
                    ),
                    "pitching_hits": calculate_weighted_arithmetic_mean(
                        data["pitching_hits"]
                    ),
                    "pitching_walks": calculate_weighted_arithmetic_mean(
                        data["pitching_walks"]
                    ),
                    "pitching_home_runs": calculate_weighted_arithmetic_mean(
                        data["pitching_home_runs"]
                    ),
                    "opp_runs": calculate_weighted_arithmetic_mean(
                        [game.runs for game in matchup_last_games]
                    ),
                    "opp_ops": calculate_weighted_arithmetic_mean(
                        [game.ops for game in matchup_last_games]
                    ),
                    "opp_slugging_pct": calculate_weighted_arithmetic_mean(
                        [game.slugging_pct for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["earned_runs"], ddof=1)

    elif stat == "pitching_hits":
        data = pd.DataFrame(
            {
                "innings_pitched": [game.innings_pitched for game in last_games],
                "pitches_thrown": [game.pitches_thrown for game in last_games],
                "pitching_strikeouts": [
                    game.pitching_strikeouts for game in last_games
                ],
                "opp_batting_avg": [
                    game.batting_avg for game in team_opp_last_games
                ],
                "opp_slugging_pct": [
                    game.slugging_pct for game in team_opp_last_games
                ],
                "opp_ops": [game.ops for game in team_opp_last_games],
                "pitching_hits": [game.pitching_hits for game in last_games],
            }
        )
        x_values = data[
            [
                "innings_pitched",
                "pitches_thrown",
                "pitching_strikeouts",
                "opp_batting_avg",
                "opp_slugging_pct",
                "opp_ops",
            ]
        ]
        y_values = data["pitching_hits"]
        model = make_pipeline(StandardScaler(), Ridge(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "innings_pitched": calculate_weighted_arithmetic_mean(
                        data["innings_pitched"]
                    ),
                    "pitches_thrown": calculate_weighted_arithmetic_mean(
                        data["pitches_thrown"]
                    ),
                    "pitching_strikeouts": calculate_weighted_arithmetic_mean(
                        data["pitching_strikeouts"]
                    ),
                    "opp_batting_avg": calculate_weighted_arithmetic_mean(
                        [game.batting_avg for game in matchup_last_games]
                    ),
                    "opp_slugging_pct": calculate_weighted_arithmetic_mean(
                        [game.slugging_pct for game in matchup_last_games]
                    ),
                    "opp_ops": calculate_weighted_arithmetic_mean(
                        [game.ops for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["pitching_hits"], ddof=1)

    elif stat == "pitching_walks":
        data = pd.DataFrame(
            {
                "innings_pitched": [game.innings_pitched for game in last_games],
                "pitches_thrown": [game.pitches_thrown for game in last_games],
                "balls": [game.balls for game in last_games],
                "opp_on_base_pct": [
                    game.on_base_pct for game in team_opp_last_games
                ],
                "opp_walks": [game.walks for game in team_opp_last_games],
                "pitching_walks": [game.pitching_walks for game in last_games],
            }
        )
        x_values = data[
            [
                "innings_pitched",
                "pitches_thrown",
                "balls",
                "opp_on_base_pct",
                "opp_walks",
            ]
        ]
        y_values = data["pitching_walks"]
        model = make_pipeline(StandardScaler(), PoissonRegressor(alpha=1))
        model.fit(x_values, y_values)
        next_game_inputs = pd.DataFrame(
            [
                {
                    "innings_pitched": calculate_weighted_arithmetic_mean(
                        data["innings_pitched"]
                    ),
                    "pitches_thrown": calculate_weighted_arithmetic_mean(
                        data["pitches_thrown"]
                    ),
                    "balls": calculate_weighted_arithmetic_mean(data["balls"]),
                    "opp_on_base_pct": calculate_weighted_arithmetic_mean(
                        [game.on_base_pct for game in matchup_last_games]
                    ),
                    "opp_walks": calculate_weighted_arithmetic_mean(
                        [game.walks for game in matchup_last_games]
                    ),
                }
            ]
        )
        sd = np.std(data["pitching_walks"], ddof=1)

    else:
        raise ValueError(f"Unknown stat: {stat}")

    predicted_value = model.predict(next_game_inputs)[0]
    final_prop = predicted_value + bias * sd

    if np.isnan(final_prop) or np.isinf(final_prop):
        return 0

    return round_prop(final_prop)


def is_prop_eligible(metric: Stat, position: str) -> bool:
    """Determine if a player is eligible for a prop based on their position.
    
    Validates that the requested stat is appropriate for the player's position.
    Pitchers are only eligible for pitching stats, while position players are
    eligible for batting stats. Two-way players are eligible for all stats.
    
    Args:
        metric: The statistic to check eligibility for.
        position: The player's position ('Pitcher', 'Two-Way Player', or position player).
        
    Returns:
        True if the player is eligible for this prop based on position, False otherwise.
    """
    # For pitchers, only allow pitching stats
    if position == "Pitcher":
        if metric in [
            "pitching_hits",
            "pitching_walks",
            "pitches_thrown",
            "earned_runs",
            "pitching_strikeouts",
        ]:
            return True
        else:
            print("Skip due to position incompatibility\n")
            return False

    # For two-way players, allow all stats
    if position == "Two-Way Player":
        return True

    # For batting stats, exclude pitchers
    if metric in ["hits", "home_runs", "doubles", "triples", "rbi", "strikeouts"]:
        if position == "Pitcher":
            print("Skip due to position incompatibility\n")
            return False
        return True

    # For pitching stats, only allow pitchers and two-way players
    if metric in [
        "pitching_hits",
        "pitching_walks",
        "pitches_thrown",
        "earned_runs",
        "pitching_strikeouts",
    ]:
        if position != "Two-Way Player" and position != "Pitcher":
            print("Skip due to position incompatibility\n")
            return False
        return True

    return True


def get_player_from_db(session: Session, player_id: str) -> Players | None:
    """Fetch a player's information from the database.
    
    Retrieves complete player data including name, position, and team information
    from the players table.
    
    Args:
        session: SQLAlchemy database session
        player_id: The unique player identifier.
        
    Returns:
        Player object containing player information, or None if not found.
        
    Raises:
        SystemExit: If database query fails.
    """
    try:
        query = select(Players).where(Players.id == player_id)
        result = session.execute(query).scalar_one_or_none()
        return result
    except Exception as e:
        print(f"⚠️ Error fetching player {player_id}: {e}")
        sys.exit(1)


def get_game_players(session: Session, game_id: int, probable_pitchers: list[str]) -> list[Players]:
    """Get all eligible players for a specific MLB game.
    
    Fetches player data from the MLB API boxscore and filters out bench players.
    For pitchers, only includes probable pitchers. For position players, includes
    all active players (not on bench).
    
    Args:
        session: SQLAlchemy database session
        game_id: The MLB game identifier.
        probable_pitchers: List of probable pitcher names for the game.
        
    Returns:
        List of Player objects eligible for prop generation.
        
    Raises:
        SystemExit: If the API call or data processing fails.
    """
    try:
        game_data = statsapi.get("game", {"gamePk": game_id})
        boxscore = game_data["liveData"]["boxscore"]
        players = []

        teams_data = boxscore.get("teams", {})
        for team_side in ["away", "home"]:
            if team_side not in teams_data:
                continue

            team_data = teams_data[team_side]

            players_data = team_data.get("players", {})
            for player_key, _ in players_data.items():
                if not player_key.startswith("ID"):
                    continue
                player_id = player_key.replace("ID", "")
                if player_id in [str(id) for id in team_data["bench"]]:
                    print("Bench player skipped\n")
                    continue
                player_data = get_player_from_db(session, player_id)
                if player_data is not None:
                    if player_data.position != "Pitcher":
                        players.append(player_data)
                    else:
                        if player_data.name in probable_pitchers:
                            players.append(player_data)

        return players

    except Exception as e:
        print(f"Getting players failed due to: {e}")
        sys.exit(1)


def main() -> None:
    """Main function to generate MLB props for today's games.
    
    Orchestrates the entire MLB prop generation process:
    1. Fetches today's MLB games from the statsapi
    2. Processes each player in each game
    3. Checks position-based eligibility for various stats
    4. Generates prop lines using machine learning models
    5. Stores props in the database with appropriate pick options
    
    The function handles both batting and pitching props, with different
    pick options (over/under vs over only) based on the stat type.
    """
    start = time()
    today = datetime.today().strftime("%Y-%m-%d")
    if len(sys.argv) == 2:
        today = sys.argv[1]
    print("Fetching today's MLB games")

    # Get schedule for date range
    schedule = statsapi.schedule(start_date=today, end_date=today)
    print(f"Found {len(schedule)} games")

    session = get_db_session()
    try:
        player_data_list: list[PlayerData] = []
        team_games_cache: dict[str, list[MlbGames]] = {}
        total_props_generated = 0

        for i, game in enumerate(schedule):
            print(
                f"Getting initial game data for game {game['game_id']} {i + 1}/{len(schedule)}\n"
            )

            home_team_id = game["home_id"]
            away_team_id = game["away_id"]
            players = get_game_players(
                session,
                game["game_id"],
                [game["home_probable_pitcher"], game["away_probable_pitcher"]],
            )

            for player in players:
                player_last_games = get_player_last_games(
                    session, player.id, "mlb", n_games
                )

                matchup = ""
                if player.team_id == home_team_id:
                    matchup = away_team_id
                else:
                    matchup = home_team_id

                player_data_list.append(
                    {
                        "matchup": matchup,
                        "player": player,
                        "game_id": game["game_id"],
                        "last_games": player_last_games,
                        "game_start_time": game["game_datetime"],
                    }
                )

        for player_data in player_data_list:
            player = player_data["player"]
            print(
                f"Processing player {player.name} {player.id} against team {player_data['matchup']}\n"
            )
            
            stat_eligibility = {}
            for stat in stats_arr:
                stat_eligibility[stat] = is_prop_eligible(stat, player.position)

            # Skip if no props are eligible
            if not any(stat_eligibility.values()):
                print(
                    f"🚨 Skipping player {player.name}, {player.id}. Not eligible by stats.\n"
                )
                continue

            sample_size = len(player_data["last_games"])
            if sample_size == 0:
                continue

            # we get the last n games for the opposing team
            if player_data["matchup"] not in team_games_cache:
                team_games_cache[player_data["matchup"]] = get_team_last_games(
                    session, player_data["matchup"], "mlb", sample_size
                )
            matchup_last_games = team_games_cache[player_data["matchup"]]

            # we get full team stats for the player's last n games
            # we use the get games by id function to make sure we aren't getting games the player didn't play in

            games_id_list = [game.game_id for game in player_data["last_games"]]

            team_last_games = get_games_by_id(session, games_id_list, "mlb", sample_size)

            team_opp_games = get_opposing_team_last_games(
                session, games_id_list, "mlb", sample_size
            )

            for stat in stats_arr:
                if stat_eligibility[stat]:
                    line = generate_prop(
                        stat,
                        player_data["last_games"],
                        matchup_last_games,
                        team_last_games,
                        team_opp_games,
                    )
                    if line > 0:
                        pick_options = []
                        if stat in [
                            "pitching_hits",
                            "earned_runs",
                            "pitches_thrown",
                            "pitching_strikeouts",
                        ]:
                            pick_options.extend(["over", "under"])
                        else:
                            pick_options.append("over")
                        insert_prop(
                            session,
                            line,
                            str(player_data["game_id"]),
                            player.id,
                            stat,
                            player_data["game_start_time"],
                            "mlb",
                            pick_options,
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