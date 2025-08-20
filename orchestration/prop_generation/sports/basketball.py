import json
import sys
import traceback
from datetime import datetime
from time import time
from zoneinfo import ZoneInfo

import numpy
from my_types.server import (
    BasketballPlayerStats,
    BasketballTeamStats,
    LeagueAverages,
    Player,
)
from prop_generation.configs.basketball import (
    ELIGIBILITY_THRESHOLDS,
    SAMPLE_SIZE,
    MIN_LINE_FOR_UNDER,
    get_basketball_prop_configs,
    get_basketball_stats_list,
)
from prop_generation.generator.base import GameStats
from prop_generation.generator.main import BasePropGenerator
from utils import data_feeds_req, server_req, setup_logger
from constants import VALID_COLLEGE_CONFERENCES, VALID_INDEPENDENT_TEAMS

logger = setup_logger(__name__)


def is_stat_eligible_for_player(
    stat: str,
    player_avg: float,
    league_avg: float,
    minutes_avg: float,
    league_minutes_avg: float,
) -> bool:
    """Check if a player is eligible for a specific stat prop based on performance and position."""
    if stat not in ELIGIBILITY_THRESHOLDS:
        return False

    if minutes_avg <=  ELIGIBILITY_THRESHOLDS["minutes"] * league_minutes_avg:
        return False

    base_threshold = ELIGIBILITY_THRESHOLDS[stat]

    return player_avg >= base_threshold * league_avg


def get_position_umbrella(position: str):
    if position in ["FC", "PF", "SF", "F", "GF"]:
        return "F"
    elif position in ["SG", "PG", "G"]:
        return "G"
    else:
        return "C"


def main():
    try:
        start = time()
        total_props_generated = 0

        today_str = (
            sys.argv[1]
            if len(sys.argv) > 1
            else datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
        )

        stats_list = get_basketball_stats_list()
        configs = get_basketball_prop_configs()

        for league in ["NCAABB", "NBA"]:
            today_schedule_req = data_feeds_req(f"/schedule/{today_str}/{league}")
            if today_schedule_req.status_code == 304:
                logger.info(f"No {league} games today, skipping")
                continue

            leagues_averages = {}
            for stat in stats_list:
                config = configs[stat]
                leagues_averages[stat] = {}
                for position in ["G", "F", "C"]:
                    logger.info(f"Fetching league average {stat} for {position}")
                    league_position_avg: LeagueAverages = server_req(
                        route=f"/stats/basketball/league/{league}/averages/{config.target_field}?position={position}",
                        method="GET",
                    ).json()
                    leagues_averages[stat][position] = league_position_avg["average"]

            league_props_generated = 0

            league_avg_minutes_data: LeagueAverages = server_req(
                route=f"/stats/basketball/league/{league}/averages/minutes",
                method="GET",
            ).json()

            games_today = today_schedule_req.json()
            games_list = games_today["data"][league]
            for game in games_list:        
                team_ids: list[int] = [game["home_team_ID"], game["away_team_ID"]]

                if league == "NCAABB":
                    home_team_data = server_req(
                        route=f"/teams/{team_ids[0]}/league/{league}", method="GET"
                    ).json()
                    if home_team_data["conference"] not in VALID_COLLEGE_CONFERENCES and home_team_data["fullName"] not in VALID_INDEPENDENT_TEAMS:
                        away_team_data = server_req(
                            route=f"/teams/{team_ids[1]}/league/{league}", method="GET"
                        ).json()
                        if away_team_data["conference"] not in VALID_COLLEGE_CONFERENCES and away_team_data["fullName"] not in VALID_INDEPENDENT_TEAMS:
                            continue
                                
                logger.info(f"Processing {league} game {game['game_ID']}")

                game_insert_body = {
                    "gameId": game["game_ID"],
                    "startTime": game["game_time"],
                    "homeTeamId": team_ids[0],
                    "awayTeamId": team_ids[1],
                    "league": league,
                }
                server_req(
                    route="/games", method="POST", body=json.dumps(game_insert_body)
                )

                for index, team_id in enumerate(team_ids):
                    team_active_players_data: list[Player] = server_req(
                        route=f"/players/league/{league}/team/{team_id}/active",
                        method="GET",
                    ).json()

                    for player in team_active_players_data:
                        eligible_stats = []
                        position_umbrella = get_position_umbrella(player["position"])

                        player_stats_list: list[BasketballPlayerStats] = server_req(
                            route=f"/stats/basketball/league/{league}/players/{player['playerId']}?limit={SAMPLE_SIZE}",
                            method="GET",
                        ).json()

                        if not player_stats_list:
                            continue

                        avg_minutes = float(
                            numpy.mean(
                                [
                                    game_stats["minutes"]
                                    for game_stats in player_stats_list
                                ]
                            )
                        )

                        for stat in stats_list:
                            stat_config = configs[stat]
                            league_stat_avg = leagues_averages[stat][position_umbrella]

                            player_stat_avg = float(
                                numpy.mean(
                                    [
                                        game_stats[stat_config.target_field]
                                        for game_stats in player_stats_list
                                    ]
                                )
                            )
                            
                            if is_stat_eligible_for_player(
                                stat,
                                player_stat_avg,
                                league_stat_avg,
                                avg_minutes,
                                league_avg_minutes_data["average"],
                            ):
                                eligible_stats.append(stat)
                                
                        if not eligible_stats:
                            continue

                        team_stats_list: list[BasketballTeamStats] = server_req(
                            route=f"/stats/basketball/league/{league}/players/{player['playerId']}/team-stats?limit={SAMPLE_SIZE}",
                            method="GET",
                        ).json()
                        prev_opponent_stats_list: list[BasketballTeamStats] = (
                            server_req(
                                route=f"/stats/basketball/league/{league}/players/{player['playerId']}/team-stats/opponents?limit={SAMPLE_SIZE}",
                                method="GET",
                            ).json()
                        )
                        curr_opponents_stats_list: list[BasketballTeamStats] = (
                            server_req(
                                route=f"/stats/basketball/league/{league}/teams/{team_ids[0] if index == 0 else team_ids[1]}?limit={SAMPLE_SIZE}",
                                method="GET",
                            ).json()
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
                            prop_line = generator.generate_prop(
                                config, games_stats_data
                            )

                            if prop_line > 0:
                                prop_data = {
                                    "line": prop_line,
                                    "statName": config.stat_name,
                                    "statDisplayName": config.display_name,
                                    "playerId": player["playerId"],
                                    "league": league,
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

                                league_props_generated += 1
                                total_props_generated += 1
                                logger.info(
                                    f"Generated prop for {player['name']} - {config.display_name}: {prop_line}"
                                )

            logger.info(f"{league_props_generated} props generated for {league}")

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
