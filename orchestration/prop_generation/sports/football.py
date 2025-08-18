import json
import sys
import traceback
from datetime import datetime
from time import time
from zoneinfo import ZoneInfo

import numpy
from my_types.server import (
    FootballPlayerStats,
    FootballTeamStats,
    LeagueAverages,
    Player,
)
from prop_generation.configs.football import (
    get_football_prop_configs,
    get_football_stats_list,
)
from prop_generation.generator.base import GameStats
from orchestration.prop_generation.generator.main import BasePropGenerator
from utils import data_feeds_req, getenv_required, server_req, setup_logger

logger = setup_logger(__name__)


# Football eligibility thresholds based on position and stat type
FOOTBALL_ELIGIBILITY_THRESHOLDS = {
    "QB": {
        "passing_yards": 0.5,  # Starting QBs should generate props
        "passing_touchdowns": 0.5,
        "passing_rushing_touchdowns": 0.5,
        "passing_interceptions": 0.5,  # Lower threshold for interceptions
    },
    "RB": {
        "rushing_yards": 0.4,  # Primary and backup RBs
        "rushing_touchdowns": 0.3,  # TDs are less frequent
        "receiving_yards": 0.2,  # Pass-catching RBs
    },
    "WR": {
        "receiving_yards": 0.3,  # WR1, WR2, some WR3s
        "receiving_touchdowns": 0.2,  # TDs are less frequent
        "receiving_rushing_touchdowns": 0.2,
    },
    "TE": {
        "receiving_yards": 0.25,  # Pass-catching TEs
        "receiving_touchdowns": 0.2,
        "receiving_rushing_touchdowns": 0.2,
    },
    "K": {
        "field_goals_made": 0.5,  # Most active kickers
    },
}


def is_stat_eligible_for_player(
    stat: str, position: str, player_avg: float, league_avg: float, league: str
) -> bool:
    """Check if a player is eligible for a specific stat prop based on position and performance."""
    if position not in FOOTBALL_ELIGIBILITY_THRESHOLDS:
        return False

    position_thresholds = FOOTBALL_ELIGIBILITY_THRESHOLDS[position]
    if stat not in position_thresholds:
        return False
    
    if league == "NFL":
        return True

    threshold = position_thresholds[stat]
    return player_avg >= league_avg * threshold


def main():
    try:
        start = time()
        total_props_generated = 0

        today_str = (
            sys.argv[1]
            if len(sys.argv) > 1
            else datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
        )
        
        stats_list = get_football_stats_list()
        configs = get_football_prop_configs()

        for league in ["NCAAFB", "NFL"]:
            league_props_generated = 0
            today_schedule_req = data_feeds_req(f"/schedule/{today_str}/{league}")
            if today_schedule_req.status_code == 304:
                logger.info(f"No {league} games today, skipping")
                continue

            sample_size = getenv_required("FOOTBALL_SAMPLE_SIZE")

            games_today = today_schedule_req.json()
            games_list = games_today["data"][league]
            for game in games_list:
                logger.info(f"Processing {league} game {game['game_ID']}")
                team_ids: list[int] = [game["home_team_ID"], game["away_team_ID"]]

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
                        if player["position"] not in ["RB", "QB", "K", "TE", "WR"]:
                            continue

                        player_stats_list: list[FootballPlayerStats] = server_req(
                            route=f"/stats/football/league/{league}/players/{player['playerId']}?limit={sample_size}",
                            method="GET",
                        ).json()

                        if not player_stats_list:
                            continue

                        eligible_stats = []

                        for stat in stats_list:
                            stat_config = configs[stat]
                            league_stat_avg_data: LeagueAverages = server_req(
                                route=f"/stats/football/league/{league}/averages/{stat_config.target_field}?position={player['position']}",
                                method="GET",
                            ).json()

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
                                player["position"],
                                player_stat_avg,
                                league_stat_avg_data["average"],
                                league
                            ):
                                eligible_stats.append(stat)

                        if not eligible_stats:
                            continue

                        team_stats_list: list[FootballTeamStats] = server_req(
                            route=f"/stats/football/league/{league}/players/{player['playerId']}/team-stats?limit={sample_size}",
                            method="GET",
                        ).json()
                        prev_opponent_stats_list: list[FootballTeamStats] = server_req(
                            route=f"/stats/football/league/{league}/players/{player['playerId']}/team-stats/opponents?limit={sample_size}",
                            method="GET",
                        ).json()
                        curr_opponents_stats_list: list[FootballTeamStats] = server_req(
                            route=f"/stats/football/league/{league}/teams/{team_ids[0] if index == 0 else team_ids[1]}?limit={sample_size}",
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
                                        ["over", "under"] if prop_line > 5 else ["over"]
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
