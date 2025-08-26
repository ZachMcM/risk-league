import json
import sys
import traceback
from datetime import datetime
from time import time
from zoneinfo import ZoneInfo

import numpy
from my_types.server import (
    BaseballPlayerStats,
    BaseballTeamStats,
    LeagueAverages,
    Player,
)
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
from utils import data_feeds_req, server_req, setup_logger

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
        league_avg_at_bats_data: LeagueAverages = server_req(
            route="/stats/baseball/league/MLB/averages/atBats", method="GET"
        ).json()

        logger.info("Fetching MLB league average stolen bases")
        league_avg_stolen_bases_data: LeagueAverages = server_req(
            route="/stats/baseball/league/MLB/averages/stolenBases", method="GET"
        ).json()

        for game in games_list:
            logger.info(f"Processing MLB game {game['game_ID']}")
            team_ids: list[int] = [game["home_team_ID"], game["away_team_ID"]]
            starting_pitcher_ids = [
                game["home_pitcher"]["player_id"],
                game["away_pitcher"]["player_id"],
            ]

            game_insert_body = {
                "gameId": game["game_ID"],
                "startTime": game["game_time"],
                "homeTeamId": team_ids[0],
                "awayTeamId": team_ids[1],
                "league": "MLB",
            }
            server_req(route="/games", method="POST", body=json.dumps(game_insert_body))

            for index, team_id in enumerate(team_ids):
                team_active_players_data: list[Player] = server_req(
                    route=f"/players/league/MLB/team/{team_id}/active", method="GET"
                ).json()

                for player in team_active_players_data:
                    eligible_stats = []
                    player_stats_list: list[BaseballPlayerStats] = server_req(
                        route=f"/stats/baseball/league/MLB/players/{player['playerId']}?limit={SAMPLE_SIZE}",
                        method="GET",
                    ).json()

                    if not player_stats_list:
                        continue

                    avg_at_bats = numpy.mean(
                        [game_stats["atBats"] for game_stats in player_stats_list]
                    )
                    avg_stolen_bases = numpy.mean(
                        [game_stats["stolenBases"] for game_stats in player_stats_list]
                    )

                    for stat in stats_list:
                        if stat in PITCHING_STATS:
                            if player["playerId"] == starting_pitcher_ids[index]:
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
                        logger.info(
                            f"No eligible stats skipping player {player['name']}"
                        )
                        continue

                    team_stats_list: list[BaseballTeamStats] = server_req(
                        route=f"/stats/baseball/league/MLB/players/{player['playerId']}/team-stats?limit={SAMPLE_SIZE}",
                        method="GET",
                    ).json()
                    prev_opponent_stats_list: list[BaseballTeamStats] = server_req(
                        route=f"/stats/baseball/league/MLB/players/{player['playerId']}/team-stats/opponents?limit={SAMPLE_SIZE}",
                        method="GET",
                    ).json()
                    curr_opponents_stats_list: list[BaseballTeamStats] = server_req(
                        route=f"/stats/baseball/league/MLB/teams/{team_ids[0] if index == 0 else team_ids[1]}?limit={SAMPLE_SIZE}",
                        method="GET",
                    ).json()

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
                            prop_data = {
                                "line": prop_line,
                                "statName": config.stat_name,
                                "statDisplayName": config.display_name,
                                "playerId": player["playerId"],
                                "league": "MLB",
                                "gameId": game["game_ID"],
                                "choices": (
                                    ["over", "under"] if prop_line > MIN_LINE_FOR_UNDER else ["over"]
                                ),
                            }

                            server_req(
                                route="/props",
                                method="POST",
                                body=json.dumps(prop_data),
                            )

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
