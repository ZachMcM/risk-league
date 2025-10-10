import sys
import json
import traceback
from datetime import datetime
from time import time
from zoneinfo import ZoneInfo
from db.games import Game
from db.props import Prop
from db.players import get_active_players_for_team, Player
from db.stats.basketball import (
    BasketballPlayerStats,
    BasketballTeamStats,
    LeagueAverages,
    get_basketball_player_stats,
    get_basketball_team_stats,
    get_basketball_team_stats_for_player,
    get_basketball_opponent_stats_for_player,
    get_basketball_league_averages,
)

import numpy
from prop_generation.configs.basketball import (
    ELIGIBILITY_THRESHOLDS,
    SAMPLE_SIZE,
    MIN_LINE_FOR_UNDER,
    get_basketball_prop_configs,
    get_basketball_stats_list,
)
from prop_generation.generator.base import GameStats
from prop_generation.generator.main import BasePropGenerator
from utils import data_feeds_req, setup_logger

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

    if minutes_avg < ELIGIBILITY_THRESHOLDS["minutes"] * league_minutes_avg:
        return False

    base_threshold = ELIGIBILITY_THRESHOLDS[stat]

    return player_avg > base_threshold * league_avg


def get_position_umbrella(position: str):
    if position in ["FC", "PF", "SF", "F", "GF"]:
        return "F"
    elif position in ["SG", "PG", "G"]:
        return "G"
    else:
        return "C"


def main():
    """Test script to generate basketball props without DB insertion - outputs to file."""
    try:
        # Parse command line arguments
        if len(sys.argv) < 2:
            print("Usage: python test_basketball_prop_generation.py <output_file> [date]")
            print("  output_file: Path to output JSON file")
            print("  date: Optional date in YYYY-MM-DD format (defaults to today)")
            sys.exit(1)

        output_file = sys.argv[1]
        today_str = (
            sys.argv[2]
            if len(sys.argv) > 2
            else datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
        )

        start = time()
        total_props_generated = 0

        # Data structures to hold output instead of DB inserts
        games_output = []
        props_output = []
        league_summaries = []

        stats_list = get_basketball_stats_list()
        configs = get_basketball_prop_configs()

        for league in ["NCAABB", "NBA"]:
            today_schedule_req = data_feeds_req(f"/schedule/{today_str}/{league}")
            if today_schedule_req.status_code == 304:
                logger.info(f"No {league} games today, skipping")
                league_summaries.append({
                    "league": league,
                    "games_count": 0,
                    "props_count": 0,
                    "message": "No games scheduled"
                })
                continue

            leagues_averages = {}
            for stat in stats_list:
                config = configs[stat]
                leagues_averages[stat] = {}
                for position in ["G", "F", "C"]:
                    logger.info(f"Fetching league average {stat} for {position}")
                    league_position_avg: LeagueAverages = (
                        get_basketball_league_averages(
                            league=league, stat=config.stat_name, position=position
                        )
                    )
                    leagues_averages[stat][position] = league_position_avg["average"]

            league_props_generated = 0

            league_avg_minutes_data: LeagueAverages = get_basketball_league_averages(
                league=league, stat="minutes"
            )

            games_today = today_schedule_req.json()
            games_list = games_today["data"][league]
            league_games_count = 0

            for i, game in enumerate(games_list):
                logger.info(f"Processing game {game['game_ID']} ({i + 1}/{len(games_list)})")
                team_ids: list[int] = [game["home_team_ID"], game["away_team_ID"]]

                game_data: Game = {
                    "game_id": game["game_ID"],
                    "start_time": game["game_time"],
                    "home_team_id": team_ids[0],
                    "away_team_id": team_ids[1],
                    "league": league,
                }

                # Instead of insert_game(game_data), save to output
                games_output.append(game_data)
                league_games_count += 1

                for index, team_id in enumerate(team_ids):
                    team_active_players_data: list[Player] = (
                        get_active_players_for_team(league, team_id)
                    )

                    for player in team_active_players_data:
                        eligible_stats = []
                        position_umbrella = get_position_umbrella(player["position"])

                        player_stats_list: list[BasketballPlayerStats] = (
                            get_basketball_player_stats(
                                league=league,
                                player_id=player["player_id"],
                                limit=SAMPLE_SIZE,
                            )
                        )

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
                                        game_stats[stat_config.stat_name]
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
                            logger.warning(f"No eligible stats for {player['name']}")
                            continue

                        team_stats_list: list[BasketballTeamStats] = (
                            get_basketball_team_stats_for_player(
                                league=league,
                                player_id=player["player_id"],
                                limit=SAMPLE_SIZE,
                            )
                        )
                        prev_opponent_stats_list: list[BasketballTeamStats] = (
                            get_basketball_opponent_stats_for_player(
                                league=league,
                                player_id=player["player_id"],
                                limit=SAMPLE_SIZE,
                            )
                        )
                        curr_opponents_stats_list: list[BasketballTeamStats] = (
                            get_basketball_team_stats(
                                league=league,
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
                            prop_line = generator.generate_prop(
                                config, games_stats_data
                            )

                            if prop_line > 0:
                                prop_data: Prop = {
                                    "line": prop_line,
                                    "stat_name": config.stat_name,
                                    "stat_display_name": config.display_name,
                                    "player_id": player["player_id"],
                                    "player_name": player["name"],  # Add player name for readability
                                    "player_position": player["position"],  # Add position for context
                                    "league": league,
                                    "game_id": game["game_ID"],
                                    "choices": (
                                        ["over", "under"]
                                        if prop_line > MIN_LINE_FOR_UNDER
                                        else ["over"]
                                    ),
                                }

                                # Instead of insert_prop(prop_data), save to output
                                props_output.append(prop_data)

                                league_props_generated += 1
                                total_props_generated += 1
                                logger.info(
                                    f"Generated prop for {player['name']} - {config.display_name}: {prop_line}"
                                )

            logger.info(f"{league_props_generated} props generated for {league}")
            league_summaries.append({
                "league": league,
                "games_count": league_games_count,
                "props_count": league_props_generated
            })

        end = time()
        execution_time = end - start

        logger.info(
            f"Script finished executing in {execution_time:.2f} seconds. A total of {total_props_generated} props were generated"
        )

        # Write all output to file
        output_data = {
            "date": today_str,
            "execution_time_seconds": round(execution_time, 2),
            "total_games": len(games_output),
            "total_props": total_props_generated,
            "league_summaries": league_summaries,
            "games": games_output,
            "props": props_output
        }

        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

        logger.info(f"Output written to {output_file}")

    except Exception as e:
        logger.error(f"There was an error generating props: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        sys.exit(1)


if __name__ == "__main__":
    main()
