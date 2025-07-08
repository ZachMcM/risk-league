import logging
import sys
from datetime import datetime
from time import time
from typing import Any

import numpy as np
import requests
from sqlalchemy.orm import Session
from sqlalchemy import or_, select

from nba.my_types import CombinedStat, PlayerData
from nba.constants import min_num_stats, minutes_threshold, n_games, sigma_coeff
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
from shared.utils import round_prop

# New prop generation system imports
from nba.prop_generator import NbaPropGenerator
from nba.prop_configs import get_nba_stats_list
from shared.prop_generation.base import GameData


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def get_today_schedule(test_date: str = None) -> list[dict[str, Any]]:
    """Fetch NBA games scheduled for today from the NBA API."""
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


# Keep existing eligibility functions for now
_metric_stats_cache: dict[tuple[str, str], MetricStats] = {}


def get_metric_stats(
    session: Session, metric: str, position: str, use_playoffs: bool
) -> MetricStats:
    """Gets the league mean and standard deviation of a specific stat"""
    cache_key = (metric, position)
    if cache_key in _metric_stats_cache:
        return _metric_stats_cache[cache_key]

    def build_stmt(game_type_filter, season_filter):
        return (
            select(NbaPlayerStats)
            .join(NbaGames, NbaGames.id == NbaPlayerStats.game_id)
            .join(Players, Players.id == NbaPlayerStats.player_id)
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

        result = session.execute(stmt).scalars().all()

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
            result = session.execute(stmt).scalars().all()

        stats = [getattr(game, metric) for game in result]
        metric_stats = {"mean": np.mean(stats), "sd": np.std(stats)}
        _metric_stats_cache[cache_key] = metric_stats
        return metric_stats

    except Exception as e:
        logger.fatal(
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
            .join(NbaGames, NbaGames.id == NbaPlayerStats.game_id)
            .join(Players, Players.id == NbaPlayerStats.player_id)
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
        result = session.execute(stmt).scalars().all()

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
            result = session.execute(stmt).scalars().all()

        combined_values = [sum(row) for row in result]
        stat = {
            "mean": np.mean(combined_values),
            "sd": np.std(combined_values),
        }
        _combined_stats_cache[cache_key] = stat
        return stat

    except Exception as e:
        logger.fatal(
            f"⚠️ Error getting stats for metrics {metric_list} for the {get_current_season()} season, {e}"
        )
        sys.exit(1)


def is_prop_eligible(
    session: Session,
    stat: str,
    player_stat_average: float,
    position: str,
    mpg: float,
    use_playoffs=False,
) -> bool:
    """Determine if a player is eligible for a prop on a specific stat."""
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
    """Check if a player is eligible for a combined stat prop."""
    combined_metric_list: list[str] = []
    if stat == "pra":
        combined_metric_list = ["pts", "reb", "ast"]
    elif stat == "pts_ast":
        combined_metric_list = ["pts", "ast"]
    elif stat == "reb_ast":
        combined_metric_list = ["reb", "ast"]

    stat_desc = get_combined_metric_stats(
        session, combined_metric_list, position, use_playoffs
    )

    return (
        mpg > minutes_threshold
        and player_stat_average >= stat_desc["mean"] - sigma_coeff * stat_desc["sd"]
    )


def main() -> None:
    """Main function to generate NBA props using the new prop generation system."""
    start = time()

    test_date = None
    if len(sys.argv) == 2:
        test_date = sys.argv[1]

    logger.info(
        f"Currently getting games for {'today' if test_date is None else test_date}"
    )
    todays_games = get_today_schedule(test_date=test_date)
    logger.info(
        f"Finished getting games for {'today' if test_date is None else test_date} ✅"
    )

    session = get_db_session()

    # Initialize the new prop generator
    prop_generator = NbaPropGenerator()

    try:
        player_data_list: list[PlayerData] = []
        team_games_cache: dict[str, list[NbaGames]] = {}
        total_props_generated = 0
        regular_season_only = True

        # Collect player data (same as before)
        for i, today_game in enumerate(todays_games):
            game_type = get_game_type(today_game["gameId"])
            if regular_season_only == True and game_type == "playoffs":
                regular_season_only = False

            if game_type == "all_star":
                logger.info("🚨 Skipping this game because its an all start game")
                continue

            logger.info(
                f"Getting initial game data for game {today_game['gameId']} {i + 1}/{len(todays_games)}"
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
                    logger.info(f"🚨 Skipping player {player}")
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

        # Process each player using new system
        for player_data in player_data_list:
            player = player_data["player"]
            logger.info(
                f"Processing player {player.name} {player.id} against team {player_data['matchup']}"
            )

            # Get team game data (same as before)
            if player_data["matchup"] not in team_games_cache:
                team_games_cache[player_data["matchup"]] = get_team_last_games(
                    session, player_data["matchup"], "nba", n_games
                )
            matchup_last_games = team_games_cache[player_data["matchup"]]

            games_id_list = [game.game_id for game in player_data["last_games"]]
            team_last_games = get_games_by_id(session, games_id_list, "nba", n_games)
            team_opp_games = get_opposing_team_last_games(
                session, games_id_list, "nba", n_games
            )

            # Calculate means for eligibility (keep existing logic)
            stat_means = {}
            for stat in ["pts", "reb", "ast", "three_pm", "blk", "stl", "tov"]:
                stat_means[stat] = np.mean(
                    [getattr(game, stat) for game in player_data["last_games"]]
                )

            # Calculate combined stat means
            stat_means["pra"] = np.mean(
                [game.pts + game.ast + game.reb for game in player_data["last_games"]]
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
                logger.info(
                    f"🚨 Skipping player {player.name}, {player.id}. Not eligible by stats.\\n"
                )
                continue

            # Create GameData object for new prop generation system
            game_data = GameData(
                player_games=player_data["last_games"],
                team_games=team_last_games,
                opponent_team_games=team_opp_games,
                matchup_team_games=matchup_last_games,
            )

            # Generate props using new system
            generated_props = {}

            # Get available stats from auto-registration system
            available_stats = get_nba_stats_list()

            # Generate individual stat props
            for stat in available_stats:
                if stat in ["pra", "reb_ast", "pts_ast"]:
                    continue  # Handle combined stats separately

                if stat_eligibility[stat]:
                    try:
                        line = prop_generator.generate_prop_for_stat(stat, game_data)
                        if line > 0:
                            generated_props[stat] = line
                            insert_prop(
                                session,
                                line,
                                str(player_data["game_id"]),
                                player.id,
                                stat,
                                player_data["game_start_time"],
                                "nba",
                            )
                            total_props_generated += 1
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating prop for {stat}: {e}")

            # Generate combined stat props (using individual props when available)
            if stat_eligibility["pra"]:
                if "pts" not in generated_props:
                    try:
                        generated_props["pts"] = prop_generator.generate_prop_for_stat(
                            "pts", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating pts for PRA: {e}")
                        continue

                if "reb" not in generated_props:
                    try:
                        generated_props["reb"] = prop_generator.generate_prop_for_stat(
                            "reb", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating reb for PRA: {e}")
                        continue

                if "ast" not in generated_props:
                    try:
                        generated_props["ast"] = prop_generator.generate_prop_for_stat(
                            "ast", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating ast for PRA: {e}")
                        continue

                pra_line = round_prop(
                    generated_props["pts"]
                    + generated_props["reb"]
                    + generated_props["ast"]
                )
                if pra_line > 0:
                    insert_prop(
                        session,
                        pra_line,
                        str(player_data["game_id"]),
                        player.id,
                        "pra",
                        player_data["game_start_time"],
                        "nba",
                    )
                    total_props_generated += 1

            # Similar logic for pts_ast and reb_ast...
            if stat_eligibility["pts_ast"]:
                if "pts" not in generated_props:
                    try:
                        generated_props["pts"] = prop_generator.generate_prop_for_stat(
                            "pts", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating pts for pts_ast: {e}")
                        continue

                if "ast" not in generated_props:
                    try:
                        generated_props["ast"] = prop_generator.generate_prop_for_stat(
                            "ast", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating ast for pts_ast: {e}")
                        continue

                pts_ast_line = round_prop(
                    generated_props["pts"] + generated_props["ast"]
                )
                if pts_ast_line > 0:
                    insert_prop(
                        session,
                        pts_ast_line,
                        str(player_data["game_id"]),
                        player.id,
                        "pts_ast",
                        player_data["game_start_time"],
                        "nba",
                    )
                    total_props_generated += 1

            if stat_eligibility["reb_ast"]:
                if "reb" not in generated_props:
                    try:
                        generated_props["reb"] = prop_generator.generate_prop_for_stat(
                            "reb", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating reb for reb_ast: {e}")
                        continue

                if "ast" not in generated_props:
                    try:
                        generated_props["ast"] = prop_generator.generate_prop_for_stat(
                            "ast", game_data
                        )
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating ast for reb_ast: {e}")
                        continue

                reb_ast_line = round_prop(
                    generated_props["reb"] + generated_props["ast"]
                )
                if reb_ast_line > 0:
                    insert_prop(
                        session,
                        reb_ast_line,
                        str(player_data["game_id"]),
                        player.id,
                        "reb_ast",
                        player_data["game_start_time"],
                        "nba",
                    )
                    total_props_generated += 1

        end = time()
        logger.info(
            f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
        )

    finally:
        session.close()


if __name__ == "__main__":
    main()
