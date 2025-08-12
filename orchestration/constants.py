from baseball_utils import (
    extract_baseball_team_stats,
    extract_baseball_batting_stats,
    extract_baseball_pitching_stats,
)
from basketball_utils import (
    extract_basketball_team_stats,
    extract_basketball_player_stats,
)
from football_utils import (
    extract_football_team_stats,
    extract_football_player_stats,
)

leagues = ["MLB", "NFL", "NBA", "NCAABB", "NCAAFB"]

# League configuration
LEAGUE_CONFIG = {
    "MLB": {
        "stats_route_prefix": "baseball-stats",
        "team_extractor": extract_baseball_team_stats,
        "player_extractors": {
            "batting": extract_baseball_batting_stats,
            "pitching": extract_baseball_pitching_stats,
        },
    },
    "NBA": {
        "stats_route_prefix": "basketball-stats",
        "team_extractor": extract_basketball_team_stats,
        "player_extractors": {
            "default": extract_basketball_player_stats,
        },
    },
    "NCAABB": {
        "stats_route_prefix": "basketball-stats",
        "team_extractor": extract_basketball_team_stats,
        "player_extractors": {
            "default": extract_basketball_player_stats,
        },
    },
    "NFL": {
        "stats_route_prefix": "football-stats",
        "team_extractor": extract_football_team_stats,
        "player_extractors": {
            "default": extract_football_player_stats,
        },
    },
    "NCAAFB": {
        "stats_route_prefix": "football-stats",
        "team_extractor": extract_football_team_stats,
        "player_extractors": {
            "default": extract_football_player_stats,
        },
    },
}