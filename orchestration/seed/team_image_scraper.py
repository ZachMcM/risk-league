import sys
import time
import requests
from utils import setup_logger, upload_to_s3
from db.teams import get_teams_by_league, update_team_image

logger = setup_logger(__name__)


def search_espn_team(name):
    params = {"region": "us", "lang": "en", "query": name, "limit": 5, "type": "team"}
    resp = requests.get(
        "https://site.web.api.espn.com/apis/common/v3/search", params=params
    )
    data = resp.json()
    items = data.get("items", [])
    if items:
        item = items[0]
        return item.get("logos", [])[1]["href"]
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

        teams_list = get_teams_by_league(league)

        for i in range(starting_index, len(teams_list)):
            team = teams_list[i]
            logger.info(f"Processing team {team['full_name']} {i + 1}/{len(teams_list)}")
            team_logo = search_espn_team(team["full_name"])

            if team_logo:
                response = requests.get(team_logo)
                img_buffer = response.content

                # Upload to S3 and get the public URL
                file_path = f"teams/{league}/{team['team_id']}.png"
                image_url = upload_to_s3(img_buffer, file_path, content_type="image/png")

                # Update the database with the image URL
                update_team_image(
                    team_id=team["team_id"],
                    league=league,
                    image_url=image_url
                )
                logger.info(f"Updated {team['full_name']} Logo URL: {image_url}")

            time.sleep(0.1)

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
