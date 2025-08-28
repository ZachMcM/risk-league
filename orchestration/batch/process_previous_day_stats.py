import json
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from utils import data_feeds_req, setup_logger
from constants import LEAGUES
from shared.game_processor import process_game

logger = setup_logger(__name__)

def main():
    try:
        total_team_stats_inserted = 0
        total_player_stats_inserted = 0

        yesterday_str = (
            datetime.now(ZoneInfo("America/New_York")) - timedelta(days=1)
        ).strftime("%Y-%m-%d")

        for league in LEAGUES:
            feed_req = data_feeds_req(f"/live/{yesterday_str}/{league}")
            if feed_req.status_code == 304:
                logger.info(f"Skipping {league}, no games yesterday")
                continue

            feed_data = feed_req.json()
            games = feed_data["data"][league]

            league_player_stats_inserted = 0
            league_team_stats_inserted = 0

            for game in games:
                if game["status"] != "completed":
                    logger.info(
                        f"Skipping game {game['game_ID']} - status: {game['status']}"
                    )
                    continue

                team_stats_count, player_stats_count = process_game(game, league)

                league_player_stats_inserted += player_stats_count
                league_team_stats_inserted += team_stats_count

                total_team_stats_inserted += team_stats_count
                total_player_stats_inserted += player_stats_count

            logger.info(
                f"{league} Processing complete: {league_player_stats_inserted} player stats inserted and {league_team_stats_inserted} team stats inserted"
            )

        logger.info(
            f"Processing complete: {total_player_stats_inserted} player stats inserted and {total_team_stats_inserted} team stats inserted"
        )

    except Exception as e:
        logger.error(f"Error processing games: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
