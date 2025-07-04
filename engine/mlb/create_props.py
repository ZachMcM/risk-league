import os
import sys
from datetime import datetime
from time import time

import numpy as np
import pandas as pd
import statsapi
from constants import min_num_stats, n_games
from dotenv import load_dotenv
from my_types import MlbGame, MlbPlayerStats, PlayerData, Stat, stats_arr
from constants import sigma_coeff
from shared.my_types import MetricStats, Player
from shared.tables import t_mlb_games, t_mlb_player_stats, t_players
from shared.utils import db_response_to_json, json_to_csv, pretty_print
from sqlalchemy import create_engine, or_, select, and_
from sklearn.linear_model import LinearRegression

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


# Deciding implementation
def generate_prop(explanatory_vars: pd.DataFrame, response_var: pd.Series) -> float:
    model = LinearRegression().fit(explanatory_vars, response_var)


def is_prop_eligible(
    metric: Stat, player_stat_average: float, position: str, use_postseason: bool
) -> bool:
    """Gets the league mean and standard deviation of a specific stat"""
    cache_key = (metric, position)
    if cache_key in _metric_stats_cache:
        return _metric_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        if position == "Pitcher" or position == "Two-Way Player":
            position_clause = t_players.c.position.in_(["Pitcher", "Two-Way Player"])
        else:
            position_clause = t_players.c.position != "Pitcher"

        return (
            select(getattr(t_mlb_player_stats.c, metric))
            .select_from(
                t_mlb_player_stats.join(
                    t_mlb_games, t_mlb_player_stats.c.game_id == t_mlb_games.c.id
                ).join(t_players, t_mlb_player_stats.c.player_id == t_players.c.id)
            )
            .where(*game_type_filter)
            .where(position_clause)
            .where(*season_filter)
            .where(t_mlb_player_stats.c.player_id.is_not(None))
        )

    try:
        with engine.connect() as conn:
            season = str(datetime.now().year)

            # Primary filters
            game_type = "P" if use_postseason else "R"
            stmt = build_stmt(
                [t_mlb_games.c.game_type == game_type],
                [t_mlb_player_stats.c.season == season],
            )

            result = conn.execute(stmt).fetchall()
            if len(result) < min_num_stats:
                if use_postseason:
                    # Combine regular and playoffs for current season
                    game_type_filter = [
                        or_(
                            t_mlb_games.c.game_type == "R",
                            t_mlb_games.c.game_type == "P",
                        )
                    ]
                    season_filter = [t_mlb_player_stats.c.season == season]
                else:
                    game_type_filter = [t_mlb_games.c.game_type == "R"]
                    season_filter = [
                        or_(
                            t_mlb_player_stats.c.season == season,
                            t_mlb_player_stats.c.season == str(datetime.now().year),
                        )
                    ]

                stmt = build_stmt(game_type_filter, season_filter)
                result = conn.execute(stmt).fetchall()

            stats = db_response_to_json(result, metric)
            metric_stats = {"mean": np.mean(stats), "sd": np.std(stats)}
            _metric_stats_cache[cache_key] = metric_stats

            return (
                player_stat_average
                >= metric_stats["mean"] - sigma_coeff * metric_stats["sd"]
            )

    except Exception as e:
        print(f"⚠️ Error getting stats for metric {metric}, {e}")
        sys.exit(1)


def get_player_from_db(id: str) -> Player:
    try:
        with engine.connect() as conn:
            stmt = select(t_players).where(
                t_players.c.id == id,
            )
            result = conn.execute(stmt).first()
            if result is None:
                return None
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ Error fetching player {id}: {e}")
        sys.exit(1)


def get_game_players(game_id) -> list[Player]:
    """Returns a list of all players (PlayerData dict) for a given game"""
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
                player_data = get_player_from_db(player_id)
                if player_data is not None:
                    players.append(player_data)

        return players

    except Exception as e:
        print(f"Getting players failed due to: ${e}")
        sys.exit(1)


def get_team_last_games(team_id: str) -> list[MlbGame] | None:
    try:
        with engine.connect() as conn:
            stmt = (
                select(t_mlb_games)
                .where(t_mlb_games.c.team_id == team_id)
                .where(
                    or_(t_mlb_games.c.game_type == "R", t_mlb_games.c.game_type == "P")
                )
                .order_by(t_mlb_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)
            return last_games
    except Exception as e:
        print(f"⚠️  There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)
        
        
def get_opposing_team_games(id_list: list[str]) -> list[MlbGame]:
    conditions = []
    for game_id in id_list:
        raw_game_id, _ = game_id.split("_")
        game_prefix = f"{raw_game_id}_"

        conditions.append(
            and_(
                t_mlb_games.c.id.startswith(game_prefix),
                t_mlb_games.c.id != raw_game_id,
            )
        )


def get_player_last_games(player_id: str) -> list[MlbPlayerStats] | None:
    try:
        with engine.connect() as conn:
            j = t_mlb_player_stats.join(
                t_mlb_games, t_mlb_player_stats.c.game_id == t_mlb_games.c.id
            )

            stmt = (
                select(t_mlb_player_stats)
                .select_from(j)
                .where(
                    or_(
                        t_mlb_games.c.game_type == "R",
                        t_mlb_games.c.game_type == "P",
                    )
                )
                .where(t_mlb_player_stats.c.player_id == str(player_id))
                .order_by(t_mlb_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            # if no games were found or
            # the player didn't play enough out of the teams last n games
            # we return null to skip this player

            if len(last_games) != n_games:
                print(f"🚨 Skipping player {player_id}\n")
                return None
            else:
                return last_games

    except Exception as e:
        print(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


def main():
    start = time()
    today = datetime.today().strftime("%Y-%m-%d")
    print("Fetching today's MLB games from")

    # Get schedule for date range
    schedule = statsapi.schedule(start_date=today, end_date=today)
    print(f"Found {len(schedule)} games")

    player_data_list: list[PlayerData] = []
    team_games_cache: dict[str, list[MlbGame]] = {}
    total_props_generated = 0

    regular_season_only = True

    for i, game in enumerate(schedule):
        print(
            f"Getting initial game data for game {game['game_id']} {i + 1}/{len(schedule)}\n"
        )
        if regular_season_only == True and game["game_type"] == "R":
            regular_season_only = False

        home_team_id = game["home_id"]
        away_team_id = game["away_id"]
        players = get_game_players(game["game_id"])

        for player in players:
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
                    "game_id": game["game_id"],
                    "last_games": player_last_games,
                    "game_start_time": game["game_datetime"],
                }
            )

    for player_data in player_data_list:
        player = player_data["player"]
        stat_eligibility = {}
        for stat in stats_arr:
            print(
                f"Processing player {player['name']} {player['id']} against team {player_data['matchup']}\n"
            )
            mu_stat = np.mean([game[stat] for game in player_data["last_games"]])
            stat_eligibility[stat] = is_prop_eligible(
                stat, mu_stat, player["position"], use_postseason=regular_season_only
            )

        # Skip if no props are eligible
        if not any(stat_eligibility.values()):
            print(
                f"🚨 Skipping player {player['name']}, {player['id']}. Not eligible by stats but passed minutes threshold.\n"
            )
            continue

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

        team_opp_games = get_opposing_team_games(games_id_list)

    print(len(player_data_list))
    json_to_csv(player_data_list)

    end = time()
    print(
        f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
    )

    engine.dispose()


if __name__ == "__main__":
    main()
