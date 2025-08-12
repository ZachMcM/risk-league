from constants import LEAGUE_CONFIG


def extract_player_stats(game, league):
    """Extract player stats for the given league."""
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
                                game, player_id, player_stats, league
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
                                game, player_id, player_stats, league
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
                            game, player_id, player_stats, league
                        )
                    )

    return player_stats_list, total_player_stats


def extract_team_stats(game, team, league):
    """Extract team stats for the given league."""
    config = LEAGUE_CONFIG[league]
    return config["team_extractor"](game, team, league)
