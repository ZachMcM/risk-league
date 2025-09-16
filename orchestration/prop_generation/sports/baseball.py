import sys
import traceback
from datetime import datetime
from time import time, sleep
from zoneinfo import ZoneInfo
from db.games import insert_game, Game
from db.props import insert_prop, Prop
from db.players import get_active_players_for_team, Player
from db.stats.baseball import (
    BaseballPlayerStats,
    BaseballTeamStats,
    LeagueAverages,
    get_baseball_player_stats,
    get_baseball_team_stats,
    get_baseball_team_stats_for_player,
    get_baseball_opponent_stats_for_player,
    get_baseball_league_averages,
)

import numpy
from prop_generation.configs.baseball import (
    BATTING_STATS,
    PITCHING_STATS,
    SAMPLE_SIZE,
    ELIGIBILITY_THRESHOLDS,
    MIN_LINE_FOR_UNDER,
    get_baseball_prop_configs,
    get_baseball_stats_list,
)
from prop_generation.generator.base import GameStats
from prop_generation.generator.main import BasePropGenerator
from utils import data_feeds_req, setup_logger

logger = setup_logger(__name__)


def main() -> None:
    """Main function to generate MLB props using the new prop generation system."""
    try:
        start = time()
        total_props_generated = 0

        today_str = (
            sys.argv[1]
            if len(sys.argv) > 1
            else datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
        )
        today_schedule_req = data_feeds_req(f"/schedule/{today_str}/MLB")
        if today_schedule_req.status_code == 304:
            logger.info("No games today, process exiting")
            sys.exit(0)

        games_today = today_schedule_req.json()
        games_list = games_today["data"]["MLB"]

        stats_list = get_baseball_stats_list()
        configs = get_baseball_prop_configs()

        logger.info("Fetching MLB league average at bats")
        league_avg_at_bats_data: LeagueAverages = get_baseball_league_averages(
            "MLB", "at_bats"
        )

        logger.info("Fetching MLB league average stolen bases")
        league_avg_stolen_bases_data: LeagueAverages = get_baseball_league_averages(
            "MLB", "stolen_bases"
        )

        for game in games_list:
            logger.info(f"Processing MLB game {game['game_ID']}")
            team_ids: list[int] = [game["home_team_ID"], game["away_team_ID"]]
            starting_pitcher_ids = [
                game["home_pitcher"]["player_id"],
                game["away_pitcher"]["player_id"],
            ]

            game_data: Game = {
                "game_id": game["game_ID"],
                "start_time": game["game_time"],
                "home_team_id": team_ids[0],
                "away_team_id": team_ids[1],
                "league": "MLB",
            }

            insert_game(game_data)

            for index, team_id in enumerate(team_ids):
                team_active_players_data: list[Player] = get_active_players_for_team(
                    "MLB", team_id
                )

                for player in team_active_players_data:
                    eligible_stats = []
                    player_stats_list: list[BaseballPlayerStats] = (
                        get_baseball_player_stats(
                            league="MLB",
                            player_id=player["player_id"],
                            limit=SAMPLE_SIZE,
                        )
                    )

                    if not player_stats_list:
                        continue

                    avg_at_bats = numpy.mean(
                        [game_stats["at_bats"] for game_stats in player_stats_list]
                    )
                    avg_stolen_bases = numpy.mean(
                        [game_stats["stolen_bases"] for game_stats in player_stats_list]
                    )

                    for stat in stats_list:
                        if stat in PITCHING_STATS:
                            if player["player_id"] in starting_pitcher_ids:
                                eligible_stats.append(stat)
                        elif stat == "stolen_bases":
                            if (
                                avg_stolen_bases
                                >= league_avg_stolen_bases_data["average"]
                                * ELIGIBILITY_THRESHOLDS["stolen_bases"]
                                and player["position"] != "P"
                            ):
                                eligible_stats.append(stat)
                        elif stat in BATTING_STATS:
                            if (
                                avg_at_bats
                                >= league_avg_at_bats_data["average"]
                                * ELIGIBILITY_THRESHOLDS["at_bats"]
                                and player["position"] != "P"
                            ):
                                eligible_stats.append(stat)

                    if not eligible_stats:
                        logger.info(f"No eligible stats skipping player")
                        continue

                    team_stats_list: list[BaseballTeamStats] = (
                        get_baseball_team_stats_for_player(
                            league="MLB",
                            player_id=player["player_id"],
                            limit=SAMPLE_SIZE,
                        )
                    )
                    prev_opponent_stats_list: list[BaseballTeamStats] = (
                        get_baseball_opponent_stats_for_player(
                            league="MLB",
                            player_id=player["player_id"],
                            limit=SAMPLE_SIZE,
                        )
                    )
                    curr_opponents_stats_list: list[BaseballTeamStats] = (
                        get_baseball_team_stats(
                            league="MLB",
                            team_id=team_ids[1] if index == 0 else team_ids[0],
                            limit=SAMPLE_SIZE,
                        )
                    )

                    games_stats_data = GameStats(
                        player_stats_list=player_stats_list,
                        team_stats_list=team_stats_list,
                        prev_opponents_stats_list=prev_opponent_stats_list,
                        curr_opponent_stats_list=curr_opponents_stats_list,
                    )

                    generator = BasePropGenerator()

                    for stat in eligible_stats:
                        config = configs[stat]
                        prop_line = generator.generate_prop(config, games_stats_data)

                        if prop_line > 0:
                            prop_data: Prop = {
                                "line": prop_line,
                                "stat_name": config.stat_name,
                                "stat_display_name": config.display_name,
                                "player_id": player["player_id"],
                                "league": "MLB",
                                "game_id": game["game_ID"],
                                "choices": (
                                    ["over", "under"]
                                    if prop_line > MIN_LINE_FOR_UNDER
                                    else ["over"]
                                ),
                                "current_value": None,
                                "status": None,
                            }

                            insert_prop(prop_data)

                            total_props_generated += 1
                            logger.info(
                                f"Generated prop for {player['name']} - {config.display_name}: {prop_line}"
                            )

        end = time()
        logger.info(
            f"Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
        )
    except Exception as e:
        logger.error(f"There was an error generating props: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        sys.exit(1)


if __name__ == "__main__":
    main()
