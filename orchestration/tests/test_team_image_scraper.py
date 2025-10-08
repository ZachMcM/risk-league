import sys
import json
import time
import requests
from utils import setup_logger
from db.teams import get_teams_by_league

logger = setup_logger(__name__)


def search_espn_team(name, league):
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
        "limit": 10,  # Increased to check more results
        "type": "team",
        "site": site_map[league],
    }
    
    resp = requests.get(
        "https://site.web.api.espn.com/apis/common/v3/search", params=params
    )
    data = resp.json()
    items = data.get("items", [])
    
    # Validate that the team belongs to the correct league
    for item in items:
        # Check if the URL contains the correct league identifier
        url = item.get("url", "")
        if site_map[league] in url:
            logos = item.get("logos", [])
            if len(logos) > 1:
                return logos[1]["href"]
            elif logos:
                return logos[0]["href"]
    
    return None


def main():
    try:
        if len(sys.argv) < 3:
            logger.error(
                "Invalid command arguments. Usage: python test_team_image_scraper.py <league> <output_json_file> [starting_index]"
            )
            sys.exit(1)

        league = sys.argv[1]
        output_file = sys.argv[2]

        starting_index = 0
        if len(sys.argv) > 3:
            starting_index = int(sys.argv[3])

        teams_list = get_teams_by_league(league)
        results = []

        for i in range(starting_index, len(teams_list)):
            team = teams_list[i]
            logger.info(
                f"Processing team {team['full_name']} {i + 1}/{len(teams_list)}"
            )
            team_logo = search_espn_team(
                (
                    team["abbreviation"]
                    if league in ["NCAAFB", "NCAABB"]
                    else team["full_name"]
                ),
                league,
            )

            result = {
                "team_id": team["team_id"],
                "league": league,
                "full_name": team["full_name"],
                "abbreviation": team["abbreviation"],
                "image_url": team_logo,
            }
            results.append(result)

            if team_logo:
                logger.info(f"Found logo for {team['full_name']}: {team_logo}")
            else:
                logger.warning(f"No logo found for {team['full_name']}")

            time.sleep(0.1)

        # Write results to JSON file
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)

        logger.info(
            f"Successfully wrote {len(results)} team image URLs to {output_file}"
        )

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()