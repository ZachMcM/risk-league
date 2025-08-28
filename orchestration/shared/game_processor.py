import json
from extract_stats.main import (LEAGUE_CONFIG, extract_player_stats,
                                extract_team_stats)
from utils import server_req, setup_logger

logger = setup_logger(__name__)

def process_game(game, league):
    """Process a single game for the given league."""
    game_insert_body = {
        "gameId": game["game_ID"],
        "league": league,
        "homeTeamId": game["full_box"]["home_team"]["team_id"],
        "awayTeamId": game["full_box"]["away_team"]["team_id"],
        "startTime": game["game_time"],
    }

    server_req(
        route="/games", method="POST", body=json.dumps(game_insert_body)
    )

    logger.info(f"Successfully inserted game {game['game_ID']}")

    team_stats_list = []
    for team in ["home_team", "away_team"]:
        team_stats = game["full_box"][team].get("team_stats", {})
        if team_stats:
            team_stats_list.append(extract_team_stats(game, team, league))

    player_stats_list, total_player_stats = extract_player_stats(game, league)

    team_stats_post_data = []
    if team_stats_list:
        config = LEAGUE_CONFIG[league]
        team_stats_post_req = server_req(
            route=f"/stats/{config['sport']}/teams",
            method="POST",
            body=json.dumps({"teamStats": team_stats_list}),
        )
        team_stats_post_data = team_stats_post_req.json()

    player_stats_post_data = []
    if player_stats_list:
        config = LEAGUE_CONFIG[league]
        player_stats_post_req = server_req(
            route=f"/stats/{config['sport']}/players",
            method="POST",
            body=json.dumps({"playerStats": player_stats_list}),
        )
        player_stats_post_data = player_stats_post_req.json()

    logger.info(
        f"Successfully inserted {len(team_stats_post_data)} team stats and {len(player_stats_post_data)}/{total_player_stats} player stats for game {game['game_ID']}"
    )

    return len(team_stats_post_data), len(player_stats_post_data)