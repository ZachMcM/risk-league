import sys
import time
import requests
from utils import setup_logger
from db.teams import get_teams_by_league, update_team_colors

logger = setup_logger(__name__)


def search_espn_team(name, league):
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
        "type": "team",
    }
    resp = requests.get(
        "https://site.web.api.espn.com/apis/common/v3/search", params=params
    )
    data = resp.json()
    items = data.get("items", [])
    if items:
        for item in items:
            if item.get("league", "") == league_map[league]:
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

        teams_list = get_teams_by_league(league)

        for i in range(starting_index, len(teams_list)):
            team = teams_list[i]
            logger.info(
                f"Processing team {team['full_name']} {i + 1}/{len(teams_list)}"
            )
            team_info = search_espn_team(
                team["abbreviation"],
                league,
            ) or search_espn_team(team["full_name"], league)

            if not team_info:
                continue

            if team_info["color"] and team_info["alternateColor"]:
                update_team_colors(
                    team_id=team["team_id"],
                    league=league,
                    color=team_info["color"],
                    alternate_color=team_info["alternateColor"],
                )
                logger.info(
                    f"Updated {team['full_name']} color: {team_info['color']} alternateColor: {team_info['alternateColor']}"
                )

            time.sleep(0.1)

    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
