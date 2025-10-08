import sys
import time
import requests
from utils import setup_logger, upload_to_s3
from db.players import get_players_by_league, update_player_image

logger = setup_logger(__name__)


def search_espn_player(name, league):
    site_map = {
        "MLB": "mlb",
        "NBA": "nba",
        "NFL": "nfl",
        "NCAAFB": "ncf",  # ESPN uses ncf for college football
        "NCAABB": "ncb",  # ESPN uses ncb for men's college basketball
    }
    params = {
        "region": "us",
        "lang": "en",
        "query": name,
        "limit": 5,
        "type": "player",
        "site": league,
    }
    resp = requests.get(
        "https://site.web.api.espn.com/apis/common/v3/search", params=params
    )
    data = resp.json()
    items = data.get("items", [])
    if items:
        item = items[0]
        return item.get("headshot", {}).get("href")
    return None


def main():
    try:
        if len(sys.argv) < 2:
            logger.error(
                "Invalid command arguments you must provide a league argument (MLB, NBA, NFL)"
            )
            sys.exit(1)

        league = sys.argv[1]

        starting_index = 0

        if len(sys.argv) > 2:
            starting_index = int(sys.argv[2])

        total_scraped = 0

        players_list = get_players_by_league(league)

        for i in range(starting_index, len(players_list)):
            player = players_list[i]
            logger.info(
                f"Processing player {player['name']} {i + 1}/{len(players_list)}"
            )
            headshot_url = search_espn_player(player["name"], league)
            if headshot_url:
                response = requests.get(headshot_url)
                img_buffer = response.content

                # Upload to S3 and get the public URL
                file_path = f"players/{league}/{player['player_id']}.png"
                image_url = upload_to_s3(
                    img_buffer, file_path, content_type="image/png"
                )

                # Update the database with the image URL
                update_player_image(
                    player_id=player["player_id"], league=league, image_url=image_url
                )
                total_scraped += 1
                logger.info(f"Updated {player['name']} Headshot URL: {image_url}")

                time.sleep(0.1)

        logger.info(
            f"Scraped a total of {total_scraped}/{len(players_list) - (starting_index + 1)}"
        )

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
