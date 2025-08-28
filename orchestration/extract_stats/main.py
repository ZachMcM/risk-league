"""
Main interface for extracting and calculating extended statistics for different sports.

This module provides the primary functions that other modules should use for 
extracting stats from game data.
"""

from extract_stats.basketball import extract_basketball_team_stats, extract_basketball_player_stats
from extract_stats.baseball import extract_baseball_team_stats, extract_baseball_batting_stats, extract_baseball_pitching_stats
from extract_stats.football import extract_football_team_stats, extract_football_player_stats


# Configuration mapping leagues to their respective extractors
LEAGUE_CONFIG = {
    "MLB": {
        "sport": "baseball",
        "team_extractor": extract_baseball_team_stats,
        "player_extractors": {
            "batting": extract_baseball_batting_stats,
            "pitching": extract_baseball_pitching_stats,
        },
    },
    "NBA": {
        "sport": "basketball",
        "team_extractor": extract_basketball_team_stats,
        "player_extractors": {
            "default": extract_basketball_player_stats,
        },
    },
    "NCAABB": {
        "sport": "basketball",
        "team_extractor": extract_basketball_team_stats,
        "player_extractors": {
            "default": extract_basketball_player_stats,
        },
    },
    "NFL": {
        "sport": "football",
        "team_extractor": extract_football_team_stats,
        "player_extractors": {
            "default": extract_football_player_stats,
        },
    },
    "NCAAFB": {
        "sport": "football",
        "team_extractor": extract_football_team_stats,
        "player_extractors": {
            "default": extract_football_player_stats,
        },
    },
}


def extract_player_stats(game, league):
    """
    Extract player stats for the given league.
    
    Args:
        game: Game data dictionary from API
        league: League identifier (MLB, NBA, NCAABB, NFL, NCAAFB)
        
    Returns:
        tuple: (player_stats_list, total_player_count)
    """
    config = LEAGUE_CONFIG[league]
    player_stats_list = []
    total_player_stats = 0

    if league == "MLB":
        # Baseball has separate batting and pitching stats
        for team in ["home_team", "away_team"]:
            if "player_box" in game and team in game["player_box"]:
                if (
                    "batting" in game["player_box"][team]
                    and game["player_box"][team]["batting"]
                ):
                    for player_id, player_stats in game["player_box"][team][
                        "batting"
                    ].items():
                        total_player_stats += 1
                        player_stats_list.append(
                            config["player_extractors"]["batting"](
                                game,
                                game["full_box"][team]["team_id"],
                                player_id,
                                player_stats,
                                league,
                            )
                        )

                if (
                    "pitching" in game["player_box"][team]
                    and game["player_box"][team]["pitching"]
                ):
                    for player_id, player_stats in game["player_box"][team][
                        "pitching"
                    ].items():
                        total_player_stats += 1
                        player_stats_list.append(
                            config["player_extractors"]["pitching"](
                                game,
                                game["full_box"][team]["team_id"],
                                player_id,
                                player_stats,
                                league,
                            )
                        )
    else:
        # Basketball and Football have single player stats
        for team in ["home_team", "away_team"]:
            if (
                "player_box" in game
                and team in game["player_box"]
                and game["player_box"][team]
            ):
                for player_id, player_stats in game["player_box"][team].items():
                    total_player_stats += 1
                    player_stats_list.append(
                        config["player_extractors"]["default"](
                            game, game["full_box"][team]["team_id"], player_id, player_stats, league
                        )
                    )

    return player_stats_list, total_player_stats


def extract_team_stats(game, team, league):
    """
    Extract team stats for the given league.
    
    Args:
        game: Game data dictionary from API
        team: Team identifier ("home_team" or "away_team")
        league: League identifier (MLB, NBA, NCAABB, NFL, NCAAFB)
        
    Returns:
        dict: Team stats with extended calculations
    """
    config = LEAGUE_CONFIG[league]
    return config["team_extractor"](game, team, league)


def extract_basketball_team_stats(game, team, league):
    """Direct access to basketball team stats extraction."""
    return extract_basketball_team_stats(game, team, league)


def extract_basketball_player_stats(game, team_id, player_id, player_stats, league):
    """Direct access to basketball player stats extraction."""
    return extract_basketball_player_stats(game, team_id, player_id, player_stats, league)


def extract_baseball_team_stats(game, team, league="MLB"):
    """Direct access to baseball team stats extraction."""
    return extract_baseball_team_stats(game, team, league)


def extract_baseball_batting_stats(game, team_id, player_id, player_stats, league="MLB"):
    """Direct access to baseball batting stats extraction."""
    return extract_baseball_batting_stats(game, team_id, player_id, player_stats, league)


def extract_baseball_pitching_stats(game, team_id, player_id, player_stats, league="MLB"):
    """Direct access to baseball pitching stats extraction."""
    return extract_baseball_pitching_stats(game, team_id, player_id, player_stats, league)


def extract_football_team_stats(game, team, league):
    """Direct access to football team stats extraction."""
    return extract_football_team_stats(game, team, league)


def extract_football_player_stats(game, team_id, player_id, player_stats, league):
    """Direct access to football player stats extraction."""
    return extract_football_player_stats(game, team_id, player_id, player_stats, league)

