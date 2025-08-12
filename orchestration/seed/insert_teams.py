import json
import sys

from utils import data_feeds_req, server_req, setup_logger
from constants import leagues

logger = setup_logger(__name__)


def main():
    try:
        if len(sys.argv) < 2:
            logger.error("You need to provide league command arguments")
            sys.exit(1)

        provided_leagues = []

        for i in range(1, len(sys.argv)):
            if sys.argv[i] not in leagues:
                logger.error("Invalid league command argument")
                sys.exit(1)
            provided_leagues.append(sys.argv[i])

        for league in provided_leagues:
            teams_req = data_feeds_req(f"/team-info/{league}")
            teams_data = teams_req.json()
            teams = teams_data["data"][league]

            teamsList = []

            for team in teams:
                teamsList.append(
                    {
                        "teamId": team["team_id"],
                        "fullName": team["team"],
                        "league": league,
                        "abbreviation": team["abbrv"],
                        "location": team.get(
                            "location", f"{team.get('city', '')}, {team.get('state', '')}"
                        ),
                        "mascot": team["mascot"],
                        "arena": team["arena"],
                    }
                )

            post_req = server_req(
                route="/teams", method="POST", body=json.dumps({"teams": teamsList})
            )
            post_req_data = post_req.json()
            print(f"{len(post_req_data)} teams inserted for {league}")
    except Exception as e:
        logger.error(f"Error inserting teams {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
