import sys
import json
import time
import requests
from utils import setup_logger
from db.players import get_players_by_league

logger = setup_logger(__name__)


def search_espn_player(name, league):
    league_map = {
        "MLB": "mlb",
        "NBA": "nba",
        "NFL": "nfl",
        "NCAAFB": "college-football",
        "NCAABB": "mens-college-basketball",
    }
    params = {
        "region": "us",
        "lang": "en",
        "query": name,
        "limit": 5,
        "type": "player",
    }
    resp = requests.get(
        "https://site.web.api.espn.com/apis/common/v3/search", params=params
    )
    data = resp.json()
    items = data.get("items", [])
    if items:
        for item in items:
            if item.get("league", "") == league_map[league]:
                return item.get("headshot", {}).get("href")
    return None


def main():
    try:
        if len(sys.argv) < 3:
            logger.error(
                "Invalid command arguments. Usage: python test_player_image_scraper.py <league> <output_json_file> [starting_index]"
            )
            sys.exit(1)

        league = sys.argv[1]
        output_file = sys.argv[2]

        starting_index = 0
        if len(sys.argv) > 3:
            starting_index = int(sys.argv[3])

        players_list = get_players_by_league(league)
        results = []

        for i in range(starting_index, len(players_list)):
            player = players_list[i]
            logger.info(
                f"Processing player {player['name']} {i + 1}/{len(players_list)}"
            )
            headshot_url = search_espn_player(player["name"], league)

            result = {
                "player_id": player["player_id"],
                "league": league,
                "name": player["name"],
                "team_id": player.get("team_id"),
                "image_url": headshot_url
            }
            results.append(result)

            if headshot_url:
                logger.info(f"Found headshot for {player['name']}: {headshot_url}")
            else:
                logger.warning(f"No headshot found for {player['name']}")

            time.sleep(0.1)

        # Write results to JSON file
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

        logger.info(f"Successfully wrote {len(results)} player image URLs to {output_file}")

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
