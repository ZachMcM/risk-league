import sys
from time import time
from typing import Any

import numpy as np
import requests
from nba.constants import N_GAMES, MPG_SIMGA_COEFF
from nba.my_types import PlayerData
from nba.prop_configs import get_nba_stats_list

# New prop generation system imports
from nba.prop_generator import NbaPropGenerator
from nba.utils import get_game_type
from shared.date_utils import get_eastern_date_formatted
from shared.db_session import get_db_session
from shared.db_utils import (
    get_games_by_id,
    get_opposing_team_last_games,
    get_player_last_games,
    get_players_from_team,
    get_team_last_games,
    insert_prop,
)
from shared.prop_generation.base import GameData
from shared.tables import NbaGames
from shared.utils import round_prop, setup_logger
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from shared.tables import NbaPlayerStats

logger = setup_logger(__name__)


def get_today_schedule(test_date: str = None) -> list[dict[str, Any]]:
    """Fetch NBA games scheduled for today from the NBA API."""
    url = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json"
    res = requests.get(url)
    data = res.json()

    today_str = get_eastern_date_formatted("%m/%d/%Y 00:00:00")

    if test_date is not None:
        today_str = test_date + " 00:00:00"

    for date in data["leagueSchedule"]["gameDates"]:
        if date["gameDate"] == today_str:
            return date["games"]

    return []


_league_mean_mpg_cache = None


def get_league_mean_mpg(session: Session) -> tuple[float, float]:
    """Gets the league mean minutes per game for the last n_games"""
    global _league_mean_mpg_cache
    if _league_mean_mpg_cache is None:
        mpg = session.execute(
            select(NbaPlayerStats.min)
            .join(NbaGames, NbaGames.id == NbaPlayerStats.game_id)
            .where(NbaPlayerStats.min != 0)
            .order_by(desc(NbaGames.game_date))
            .limit(N_GAMES)
        ).scalars().all()
        _league_mean_mpg_cache = np.mean(mpg), np.std(mpg, ddof=1)
    return _league_mean_mpg_cache


def is_prop_eligible(session: Session, mpg: float) -> bool:
    """Determine if a player is eligible for a prop on a specific stat."""
    league_mean_mpg, league_sd_mpg = get_league_mean_mpg(session=session)
    if mpg <= league_mean_mpg + MPG_SIMGA_COEFF * league_sd_mpg:
        logger.info(f"Skipping player due to low mean mpg.")
        return False
    return True


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
                    session, player.id, "nba", N_GAMES
                )

                if len(player_last_games) != N_GAMES:
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

            sample_size = len(player_data["last_games"])
            if sample_size == 0:
                continue

            # Get team game data (same as before)
            if player_data["matchup"] not in team_games_cache:
                team_games_cache[player_data["matchup"]] = get_team_last_games(
                    session, player_data["matchup"], "nba", sample_size
                )
            matchup_last_games = team_games_cache[player_data["matchup"]]

            games_id_list = [game.game_id for game in player_data["last_games"]]
            team_last_games = get_games_by_id(
                session, games_id_list, "nba", sample_size
            )
            team_opp_games = get_opposing_team_last_games(
                session, games_id_list, "nba", sample_size
            )

            # Get minutes per game
            mpg = np.mean([game.min for game in player_data["last_games"]])

            # Check eligibility for each stat
            stat_eligibility = {}
            for stat in [
                "pts",
                "reb",
                "ast",
                "three_pm",
                "blk",
                "stl",
                "tov",
                "pra",
                "reb_ast",
                "pts_ast",
            ]:
                stat_eligibility[stat] = is_prop_eligible(session=session, mpg=mpg)

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
                                session=session,
                                line=line,
                                game_id=str(player_data["game_id"]),
                                player_id=player.id,
                                stat=stat,
                                game_start_time=player_data["game_start_time"],
                                league="nba",
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
                        session=session,
                        line=pra_line,
                        game_id=str(player_data["game_id"]),
                        player_id=player.id,
                        stat="pra",
                        game_start_time=player_data["game_start_time"],
                        league="nba",
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
                        session=session,
                        line=pts_ast_line,
                        game_id=str(player_data["game_id"]),
                        player_id=player.id,
                        stat="pts_ast",
                        game_start_time=player_data["game_start_time"],
                        league="nba",
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
                        session=session,
                        line=reb_ast_line,
                        game_id=str(player_data["game_id"]),
                        player_id=player.id,
                        stat="reb_ast",
                        game_start_time=player_data["game_start_time"],
                        league="nba",
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
