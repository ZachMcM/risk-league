import json
import sys

from utils import data_feeds_req, setup_logger
from constants import LEAGUES
from db.teams import insert_teams, Team

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
            teams_req = data_feeds_req(f"/team-info/{league}")
            teams_data = teams_req.json()
            teams = teams_data["data"][league]

            teamsList: list[Team] = []

            for team in teams:
                teamsList.append(
                    {
                        "team_id": team["team_id"],
                        "full_name": team["team"],
                        "league": league,
                        "abbreviation": team["abbrv"],
                        "location": team.get(
                            "location",
                            f"{team.get('city', '')}, {team.get('state', '')}",
                        ),
                        "mascot": team["mascot"],
                        "arena": team["arena"],
                        "conference": team["conf"]
                    }
                )

            team_ids = insert_teams(teamsList)
            print(f"{len(team_ids)} teams inserted for {league}")
    except Exception as e:
        logger.error(f"Error inserting teams {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
