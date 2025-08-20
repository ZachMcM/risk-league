import json
import sys

from constants import LEAGUES
from utils import data_feeds_req, server_req, setup_logger

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

        for league in provided_leagues:
            total_upserted = 0

            playersReq = data_feeds_req(f"/player-info/{league}")
            playersData = playersReq.json()
            players = playersData["data"][league]

            for player in players:
                req_body = {
                    "playerId": player["player_id"],
                    "name": player["player"],
                    "teamId": player["team_id"],
                    "position": player["position"],
                    "number": player["number"],
                    "height": player["height"],
                    "weight": float(player["weight"]) if player["weight"] else 0,
                    "status": player.get("status", "INACT") or "INACT",
                    "league": league,
                }
                post_req = server_req(
                    route="/players", method="POST", body=json.dumps(req_body)
                )
                if post_req.status_code != 304:
                    logger.info(f"Successfully upserted {player['player']}")
                    total_upserted += 1

            print(f"{total_upserted} {league} players upserted")

    except Exception as e:
        logger.error(f"Error upserted players {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()