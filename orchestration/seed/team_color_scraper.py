import json
import sys
import time
import requests
from my_types.server import Team
from utils import setup_logger, server_req
import requests

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
        return {
            "color": item.get("color", {}),
            "alternateColor": item.get("alternateColor", {}),
        }
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

        teams_list: list[Team] = server_req(
            route=f"/teams/league/{league}", method="GET"
        ).json()

        for i in range(starting_index, len(teams_list)):
            team = teams_list[i]
            logger.info(f"Processing team {team['fullName']} {i + 1}/{len(teams_list)}")
            team_info = search_espn_team(team["fullName"])
            if not team_info:
                continue

            if team_info["color"] and team_info["alternateColor"]:
                server_req(
                    route=f"/teams/{team['teamId']}/league/{league}/colors",
                    method="PUT",
                    body=json.dumps(
                        {
                            "color": team_info["color"],
                            "alternateColor": team_info["alternateColor"],
                        }
                    ),
                )
                logger.info(
                    f"Updated {team['fullName']} color: {team_info['color']} alternateColor: {team_info['alternateColor']}"
                )

            time.sleep(0.1)

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
