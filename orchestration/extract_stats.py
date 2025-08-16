from time_utils import convert_minutes_to_decimal


def extract_basketball_team_stats(game, team, league):
    """Extract basketball team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]

    return {
        "gameId": game["game_ID"],
        "teamId": game["full_box"][team]["team_id"],
        "league": league,
        "score": game["full_box"][team]["score"],
        "fouls": team_stats["fouls"],
        "blocks": team_stats["blocks"],
        "steals": team_stats["steals"],
        "assists": team_stats["assists"],
        "turnovers": team_stats["turnovers"],
        "rebounds": team_stats["total_rebounds"],
        "twoPointsMade": team_stats["two_points_made"],
        "fieldGoalsMade": team_stats["field_goals_made"],
        "freeThrowsMade": team_stats["free_throws_made"],
        "threePointsMade": team_stats["three_points_made"],
        "defensiveRebounds": team_stats["defensive_rebounds"],
        "offensiveRebounds": team_stats["offensive_rebounds"],
        "twoPointPercentage": team_stats["two_point_percentage"],
        "twoPointsAttempted": team_stats["two_points_attempted"],
        "fieldGoalsAttempted": team_stats["field_goals_attempted"],
        "freeThrowsAttempted": team_stats["free_throws_attempted"],
        "threePointsAttempted": team_stats["three_points_attempted"],
    }


def extract_basketball_player_stats(game, team_id, player_id, player_stats, league):
    """Extract basketball player stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
        "teamId": int(team_id),
        "league": league,
        "fouls": player_stats["fouls"],
        "blocks": player_stats["blocks"],
        "points": player_stats["points"],
        "steals": player_stats["steals"],
        "assists": player_stats["assists"],
        "minutes": convert_minutes_to_decimal(player_stats["minutes"]),
        "turnovers": player_stats["turnovers"],
        "rebounds": player_stats["total_rebounds"],
        "twoPointsMade": player_stats["two_points_made"],
        "fieldGoalsMade": player_stats["field_goals_made"],
        "freeThrowsMade": player_stats["free_throws_made"],
        "threePointsMade": player_stats["three_points_made"],
        "defensiveRebounds": player_stats["defensive_rebounds"],
        "offensiveRebounds": player_stats["offensive_rebounds"],
        "twoPointPercentage": player_stats["two_point_percentage"],
        "twoPointsAttempted": player_stats["two_points_attempted"],
        "fieldGoalsAttempted": player_stats["field_goals_attempted"],
        "freeThrowsAttempted": player_stats["free_throws_attempted"],
        "threePointsAttempted": player_stats["three_points_attempted"],
        "status": player_stats["status"],
    }


def extract_baseball_team_stats(game, team, league="MLB"):
    """Extract baseball team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]

    return {
        "gameId": game["game_ID"],
        "teamId": game["full_box"][team]["team_id"],
        "league": league,
        "errors": team_stats["E"],
        "hits": team_stats["H"],
        "runs": team_stats["R"],
        "doubles": team_stats["2B"],
        "triples": team_stats["3B"],
        "atBats": team_stats["AB"],
        "walks": team_stats["BB"],
        "caughtStealing": team_stats["CS"],
        "homeRuns": team_stats["HR"],
        "stolenBases": team_stats["SB"],
        "strikeouts": team_stats["SO"],
        "rbis": team_stats["RBI"],
    }


def extract_baseball_batting_stats(
    game, team_id, player_id, player_stats, league="MLB"
):
    """Extract baseball batting stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
        "teamId": int(team_id),
        "league": league,
        "errors": player_stats["E"],
        "hits": player_stats["H"],
        "runs": player_stats["R"],
        "singles": player_stats["1B"],
        "doubles": player_stats["2B"],
        "triples": player_stats["3B"],
        "atBats": player_stats["AB"],
        "walks": player_stats["BB"],
        "caughtStealing": player_stats["CS"],
        "homeRuns": player_stats["HR"],
        "putouts": player_stats["PO"],
        "stolenBases": player_stats["SB"],
        "strikeouts": player_stats["SO"],
        "hitByPitch": player_stats["HBP"],
        "intentionalWalks": player_stats["IBB"],
        "rbis": player_stats["RBI"],
        "outs": player_stats["Outs"],
        "status": player_stats["status"],
    }


def extract_baseball_pitching_stats(
    game, team_id, player_id, player_stats, league="MLB"
):
    """Extract baseball pitching stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
        "teamId": int(team_id),
        "league": league,
        "hitsAllowed": player_stats["H"],
        "pitchingStrikeouts": player_stats["K"],
        "losses": player_stats["L"],
        "runsAllowed": player_stats["R"],
        "saves": player_stats["S"],
        "wins": player_stats["W"],
        "singlesAllowed": player_stats["1B"],
        "doublesAllowed": player_stats["2B"],
        "triplesAllowed": player_stats["3B"],
        "pitchingWalks": player_stats["BB"],
        "balks": player_stats["BK"],
        "blownSaves": player_stats["BS"],
        "pitchingCaughtStealing": player_stats["CS"],
        "earnedRuns": player_stats["ER"],
        "homeRunsAllowed": player_stats["HR"],
        "inningsPitched": player_stats["IP"],
        "pitchingPutouts": player_stats["PO"],
        "stolenBasesAllowed": player_stats["SB"],
        "wildPitches": player_stats["WP"],
        "pitchingHitByPitch": player_stats["HBP"],
        "holds": player_stats["HLD"],
        "pitchingIntentionalWalks": player_stats["IBB"],
        "pitchesThrown": player_stats["pitches"],
        "strikes": player_stats["strikes"],
        "status": player_stats["status"],
    }


def extract_football_team_stats(game, team, league):
    """Extract football team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]

    return {
        "gameId": game["game_ID"],
        "teamId": game["full_box"][team]["team_id"],
        "league": league,
        "score": game["full_box"][team]["score"],
        "sacks": team_stats.get("sacks", 0),
        "safeties": team_stats.get("safeties", 0),
        "penaltiesTotal": team_stats.get("penalties", {}).get("total", 0),
        "penaltiesYards": team_stats.get("penalties", {}).get("yards", 0),
        "turnovers": team_stats.get("turnovers", 0),
        "firstDowns": team_stats.get("first_downs", 0),
        "totalYards": team_stats.get("total_yards", 0),
        "blockedKicks": team_stats.get("blocked_kicks", 0),
        "blockedPunts": team_stats.get("blocked_punts", 0),
        "kicksBlocked": team_stats.get("kicksBlocked", 0),
        "passingYards": team_stats.get("passing_yards", 0),
        "puntsBlocked": team_stats.get("punts_blocked", 0),
        "rushingYards": team_stats.get("rushing_yards", 0),
        "defenseTouchdowns": team_stats.get("defensive_touchdowns", 0),
        "defenseInterceptions": team_stats.get("defensive_interceptions", 0),
        "kickReturnTouchdowns": team_stats.get("kick_return_touchdowns", 0),
        "puntReturnTouchdowns": team_stats.get("punt_return_touchdowns", 0),
        "blockedKickTouchdowns": team_stats.get("blocked_kick_touchdowns", 0),
        "blockedPuntTouchdowns": team_stats.get("blocked_punt_touchdowns", 0),
        "interceptionTouchdowns": team_stats.get("interception_touchdowns", 0),
        "fumbleReturnTouchdowns": team_stats.get("fumble_return_touchdowns", 0),
        "defenseFumbleRecoveries": team_stats.get("defense_fumble_recoveries", 0),
        "fieldGoalReturnTouchdowns": team_stats.get("field_goal_return_touchdowns", 0),
        "twoPointConversionReturns": team_stats.get("two_point_conversion_returns", 0),
        "twoPointConversionAttempts": team_stats.get(
            "two_point_conversion_attempts", 0
        ),
        "twoPointConversionSucceeded": team_stats.get(
            "two_point_conversion_succeeded", 0
        ),
        "pointsAgainstDefenseSpecialTeams": team_stats.get(
            "points_against_defense_special_teams", 0
        ),
        # Only include these fields if they exist in the API response
        **(
            {"passingTouchdowns": team_stats["passing_touchdowns"]}
            if "passing_touchdowns" in team_stats
            else {}
        ),
        **(
            {"rushingTouchdowns": team_stats["rushing_touchdowns"]}
            if "rushing_touchdowns" in team_stats
            else {}
        ),
        **(
            {"specialTeamsTouchdowns": team_stats["special_teams_touchdowns"]}
            if "special_teams_touchdowns" in team_stats
            else {}
        ),
        **(
            {"totalPassingYardsAllowed": team_stats["total_passing_yards_allowed"]}
            if "total_passing_yards_allowed" in team_stats
            else {}
        ),
        **(
            {"totalRushingYardsAllowed": team_stats["total_rushing_yards_allowed"]}
            if "total_rushing_yards_allowed" in team_stats
            else {}
        ),
        **(
            {"offenseTouchdowns": team_stats["offensive_touchdowns"]}
            if "offensive_touchdowns" in team_stats
            else {}
        ),
    }


def extract_football_player_stats(game, team_id, player_id, player_stats, league):
    """Extract football player stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
        "league": league,
        "teamId": int(team_id),
        "completions": player_stats.get("completions", 0),
        "fumblesLost": player_stats.get("fumbles_lost", 0),
        "rushingLong": player_stats.get("rushing_long", 0),
        "passerRating": player_stats.get("passer_rating", 0.0),
        "passingYards": player_stats.get("passing_yards", 0.0),
        "rushingYards": player_stats.get("rushing_yards", 0.0),
        "passingAttempts": player_stats.get("passing_attempts", 0),
        "rushingAttempts": player_stats.get("rushing_attempts", 0),
        "fumbleRecoveries": player_stats.get("fumble_recoveries", 0),
        "passingTouchdowns": player_stats.get("passing_touchdowns", 0),
        "rushingTouchdowns": player_stats.get("rushing_touchdowns", 0),
        "passingInterceptions": player_stats.get("passing_interceptions", 0),
        "receivingLong": player_stats.get("receiving_long", 0),
        "receivingYards": player_stats.get("receiving_yards", 0),
        "receivingTouchdowns": player_stats.get("receiving_touchdowns", 0),
        "receptions": player_stats.get("receptions", 0),
        "fieldGoalsAttempted": player_stats.get("field_goals_attempted", 0),
        "fieldGoalsMade": player_stats.get("field_goals_made", 0),
        "fieldGoalsLong": player_stats.get("field_goals_long", 0.0),
        "extraPointsAttempted": player_stats.get("extra_points_attempted", 0),
        "extraPointsMade": player_stats.get("extra_points_made", 0),
        "status": player_stats["status"],
    }


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
    """Extract team stats for the given league."""
    config = LEAGUE_CONFIG[league]
    return config["team_extractor"](game, team, league)
