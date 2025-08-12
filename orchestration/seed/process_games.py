import json
import sys
from datetime import datetime, timedelta

from utils import data_feeds_req, server_req, setup_logger
from extract_stats import extract_player_stats, extract_team_stats
from constants import LEAGUE_CONFIG

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
            route=f"/{config['stats_route_prefix']}/teams",
            method="POST",
            body=json.dumps({"teamStats": team_stats_list}),
        )
        team_stats_post_data = team_stats_post_req.json()

    player_stats_post_data = []
    if player_stats_list:
        config = LEAGUE_CONFIG[league]
        player_stats_post_req = server_req(
            route=f"/{config['stats_route_prefix']}/players",
            method="POST",
            body=json.dumps({"playerStats": player_stats_list}),
        )
        player_stats_post_data = player_stats_post_req.json()

    logger.info(
        f"Successfully inserted {len(team_stats_post_data)} team stats and {len(player_stats_post_data)}/{total_player_stats} player stats for game {game['game_ID']}"
    )

    return len(team_stats_post_data), len(player_stats_post_data)


def main():
    try:
        if len(sys.argv) < 3:
            logger.error("Usage: python process_games.py <league> <start_date> <end_date>")
            logger.error("For MLB: python process_games.py MLB <start_date> <end_date>")
            logger.error("For others: python process_games.py <NBA|NCAABB|NFL|NCAAFB> <start_date> <end_date>")
            sys.exit(1)

        league = sys.argv[1]
        if league not in LEAGUE_CONFIG:
            logger.error(f"Invalid league: {league}. Must be one of: {', '.join(LEAGUE_CONFIG.keys())}")
            sys.exit(1)

        start_date_str = sys.argv[2]
        end_date_str = sys.argv[3]

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        except ValueError:
            logger.error("Invalid date format. Use YYYY-MM-DD format.")
            sys.exit(1)

        total_team_stats_inserted = 0
        total_player_stats_inserted = 0

        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            feed_req = data_feeds_req(f"/live/{date_str}/{league}")
            
            if feed_req.status_code == 304:
                logger.info(f"No new data for {date_str}")
                current_date += timedelta(days=1)
                continue
                
            feed_data = feed_req.json()
            games = feed_data["data"][league]

            for game in games:
                if game["status"] != "completed":
                    logger.info(f"Skipping game {game['game_ID']} - status: {game['status']}")
                    continue

                team_stats_count, player_stats_count = process_game(game, league)
                total_team_stats_inserted += team_stats_count
                total_player_stats_inserted += player_stats_count

            current_date += timedelta(days=1)

        logger.info(
            f"Processing complete: {total_player_stats_inserted} player stats inserted and {total_team_stats_inserted} team stats inserted"
        )

    except Exception as e:
        logger.error(f"Error processing games: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()