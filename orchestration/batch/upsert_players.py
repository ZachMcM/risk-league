import logging
import sys
import traceback
from time import time

from constants import LEAGUES
from db.players import Player, insert_players
from utils import data_feeds_req

logger = logging.getLogger(__name__)


def main():
    try:
        start_time = time()
        # Log startup information
        logger.info("Starting player upsert process")

        if len(sys.argv) < 2:
            logger.error("You need to provide league command arguments")
            sys.exit(1)

        provided_leagues = []

        for i in range(1, len(sys.argv)):
            if sys.argv[i] not in LEAGUES:
                logger.error("Invalid league command argument")
                sys.exit(1)
            provided_leagues.append(sys.argv[i])

        BATCH_SIZE = 500  # Adjust batch size as needed

        for league in provided_leagues:
            total_upserted = 0
            logger.info(f"Processing league: {league}")

            try:
                playersReq = data_feeds_req(f"/player-info/{league}")
                logger.info(f"Successfully fetched data for {league}")
                playersData = playersReq.json()
                players = playersData["data"][league]
                logger.info(f"Found {len(players)} players for {league}")
            except Exception as e:
                logger.error(f"Failed to fetch player data for {league}: {e}")
                logger.error(f"Full traceback: {traceback.format_exc()}")
                continue

            # Process players in batches
            batch = []
            for i, player in enumerate(players):
                player_data: Player = {
                    "player_id": player["player_id"],
                    "name": player["player"],
                    "team_id": player["team_id"],
                    "position": player.get("position") or "N/A",
                    "number": player["number"],
                    "height": player["height"],
                    "weight": (
                        int(float(player["weight"])) if player["weight"] else None
                    ),
                    "status": player.get("status", "INACT") or "INACT",
                    "league": league,
                    "updated_at": "",  # Will be set by database
                }
                batch.append(player_data)

                # Send batch when it reaches BATCH_SIZE or at the end
                if len(batch) == BATCH_SIZE or i == len(players) - 1:
                    try:
                        inserted_ids = insert_players(batch)
                        total_upserted += len(inserted_ids)
                        logger.info(
                            f"Successfully upserted batch of {len(inserted_ids)} players, {len(players) - total_upserted} left"
                        )
                    except Exception as e:
                        logger.error(f"Failed to insert batch for {league}: {e}")
                        logger.error(f"Full traceback: {traceback.format_exc()}")
                        # Continue with next batch despite failure

                    batch = []  # Reset batch

            end_time = time()
            print(
                f"{total_upserted} {league} players upserted in {end_time - start_time:.2f}s"
            )

    except Exception as e:
        logger.error(f"Fatal error in upsert_players: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        print(f"FATAL ERROR: {e}", file=sys.stderr)
        print(f"TRACEBACK: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
