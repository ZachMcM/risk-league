import sys

from constants import LEAGUES
from db.players import insert_players, Player
from utils import data_feeds_req, setup_logger

logger = setup_logger(__name__)


def main():
    try:
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

            playersReq = data_feeds_req(f"/player-info/{league}")
            playersData = playersReq.json()
            players = playersData["data"][league]

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
                    "weight": int(float(player["weight"])) if player["weight"] else None,
                    "status": player.get("status", "INACT") or "INACT",
                    "league": league,
                    "updated_at": ""  # Will be set by database
                }
                batch.append(player_data)

                # Send batch when it reaches BATCH_SIZE or at the end
                if len(batch) == BATCH_SIZE or i == len(players) - 1:
                    inserted_ids = insert_players(batch)
                    total_upserted += len(inserted_ids)
                    logger.info(f"Successfully upserted batch of {len(inserted_ids)} players, {len(players) - total_upserted} left")

                    batch = []  # Reset batch

            print(f"{total_upserted} {league} players upserted")

    except Exception as e:
        logger.error(f"Error upserted players {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()