import json
import sys
import time
import requests
from my_types.server import Player
from utils import setup_logger, server_req
import requests

logger = setup_logger(__name__)


def search_espn_player(name):
    params = {"region": "us", "lang": "en", "query": name, "limit": 5, "type": "player"}
    resp = requests.get(
        "https://site.web.api.espn.com/apis/common/v3/search", params=params
    )
    data = resp.json()
    items = data.get("items", [])
    if items:
        item = items[0]
        return {
            "id": item.get("id"),
            "name": item.get("displayName"),
            "headshot_url": item.get("headshot", {}).get("href"),
        }
    return None


def main():
    try:
        if len(sys.argv) < 2:
          logger.error("Invalid command arguments you must provide a league argument (MLB, NBA, NFL)")
          sys.exit(1)
          
        league = sys.argv[1]

        starting_index = 0

        if len(sys.argv) > 2:
            starting_index = int(sys.argv[2])

        total_scraped = 0
        
        players_list: list[Player] = server_req(
            route=f"/players/league/{league}/active", method="GET"
        ).json()

        for i in range(starting_index, len(players_list)):
            player = players_list[i]
            logger.info(f"Processing player {player['name']} {i + 1}/{len(players_list)}")
            match = search_espn_player(player["name"])
            if match and match["headshot_url"]:
                response = requests.get(match["headshot_url"])
                img_buffer = response.content

                files = {"image": ("headshot.png", img_buffer, "image/png")}
                server_req(
                    route=f"/players/{player['playerId']}/league/{league}/image",
                    method="PUT",
                    files=files,
                )
                total_scraped += 1
                logger.info(f"Updated {player['name']} Headshot URL: {match['headshot_url']}")

                time.sleep(0.1)

        logger.info(f"Scraped a total of {total_scraped}/{len(players_list) - (starting_index + 1)}")

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
