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
        "twoPointConversionAttempts": team_stats.get("two_point_conversion_attempts", 0),
        "twoPointConversionSucceeded": team_stats.get("two_point_conversion_succeeded", 0),
        "pointsAgainstDefenseSpecialTeams": team_stats.get("points_against_defense_special_teams", 0),
        # Only include these fields if they exist in the API response
        **({"passingTouchdowns": team_stats["passing_touchdowns"]} if "passing_touchdowns" in team_stats else {}),
        **({"rushingTouchdowns": team_stats["rushing_touchdowns"]} if "rushing_touchdowns" in team_stats else {}),
        **({"specialTeamsTouchdowns": team_stats["special_teams_touchdowns"]} if "special_teams_touchdowns" in team_stats else {}),
        **({"totalPassingYardsAllowed": team_stats["total_passing_yards_allowed"]} if "total_passing_yards_allowed" in team_stats else {}),
        **({"totalRushingYardsAllowed": team_stats["total_rushing_yards_allowed"]} if "total_rushing_yards_allowed" in team_stats else {}),
        **({"offenseTouchdowns": team_stats["offensive_touchdowns"]} if "offensive_touchdowns" in team_stats else {})
    }


def extract_football_player_stats(game, player_id, player_stats, league):
    """Extract football player stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
        "league": league,
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
        "passingInterceptions": player_stats.get("passing_interceptions", 0)
    }