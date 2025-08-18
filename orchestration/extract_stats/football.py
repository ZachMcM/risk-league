"""
Football statistics extraction and extended calculations.
"""


def calculate_football_player_extended_stats(player_stats):
    """Calculate extended football player statistics."""
    
    # Passing efficiency stats
    completion_pct = player_stats["completions"] / player_stats["passingAttempts"] if player_stats["passingAttempts"] > 0 else 0
    yards_per_attempt = player_stats["passingYards"] / player_stats["passingAttempts"] if player_stats["passingAttempts"] > 0 else 0
    yards_per_completion = player_stats["passingYards"] / player_stats["completions"] if player_stats["completions"] > 0 else 0
    
    # Rushing efficiency
    yards_per_carry = player_stats["rushingYards"] / player_stats["rushingAttempts"] if player_stats["rushingAttempts"] > 0 else 0
    
    # Receiving efficiency
    yards_per_reception = player_stats["receivingYards"] / player_stats["receptions"] if player_stats["receptions"] > 0 else 0
    
    # Field goal percentage
    field_goal_pct = player_stats["fieldGoalsMade"] / player_stats["fieldGoalsAttempted"] if player_stats["fieldGoalsAttempted"] > 0 else 0
    extra_point_pct = player_stats["extraPointsMade"] / player_stats["extraPointsAttempted"] if player_stats["extraPointsAttempted"] > 0 else 0
    
    # Combination stats
    receiving_rushing_touchdowns = player_stats["receivingTouchdowns"] + player_stats["rushingTouchdowns"]
    passing_rushing_touchdowns = player_stats["passingTouchdowns"] + player_stats["rushingTouchdowns"]
    total_yards = player_stats["passingYards"] + player_stats["rushingYards"] + player_stats["receivingYards"]
    
    return {
        "completionPct": round(completion_pct, 4),
        "yardsPerAttempt": round(yards_per_attempt, 2),
        "yardsPerCompletion": round(yards_per_completion, 2),
        "yardsPerCarry": round(yards_per_carry, 2),
        "yardsPerReception": round(yards_per_reception, 2),
        "fieldGoalPct": round(field_goal_pct, 4),
        "extraPointPct": round(extra_point_pct, 4),
        "receivingRushingTouchdowns": receiving_rushing_touchdowns,
        "passingRushingTouchdowns": passing_rushing_touchdowns,
        "totalYards": round(total_yards, 2),
    }


def calculate_football_team_extended_stats(game, team, team_stats, opp_team_stats):
    """Calculate extended football team statistics (matches server route calculations)."""
    
    # Get opponent team info for player stats lookup
    opp_team = "away_team" if team == "home_team" else "home_team"
    team_id = game["full_box"][team]["team_id"]
    
    # Get opponent player stats for aggregation
    opp_player_stats = []
    if "player_box" in game and opp_team in game["player_box"]:
        for _, player_stats in game["player_box"][opp_team].items():
            opp_player_stats.append(player_stats)
    
    # Calculate "allowed" stats from opponent team/player performance
    passing_yards_allowed = opp_team_stats.get("passing_yards", 0)
    rushing_yards_allowed = opp_team_stats.get("rushing_yards", 0)
    
    # Aggregate opponent completions from player stats
    completions_allowed = sum(p.get("completions", 0) for p in opp_player_stats)
    
    # Team touchdowns allowed (opponent's scoring)
    passing_touchdowns_allowed = opp_team_stats.get("passing_touchdowns", 0)
    rushing_touchdowns_allowed = opp_team_stats.get("rushing_touchdowns", 0)
    
    return {
        "passingYardsAllowed": passing_yards_allowed,
        "completionsAllowed": completions_allowed,
        "rushingYardsAllowed": rushing_yards_allowed,
        "passingTouchdownsAllowed": passing_touchdowns_allowed,
        "rushingTouchdownsAllowed": rushing_touchdowns_allowed,
    }


def extract_football_team_stats(game, team, league):
    """Extract football team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]
    
    # Get opponent team stats for extended calculations
    opp_team = "away_team" if team == "home_team" else "home_team"
    opp_team_stats = game["full_box"][opp_team]["team_stats"]

    base_stats = {
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
            {"passingYardsAllowed": team_stats["passing_yards_allowed"]}
            if "passing_yards_allowed" in team_stats
            else {}
        ),
        **(
            {"rushingYardsAllowed": team_stats["rushing_yards_allowed"]}
            if "rushing_yards_allowed" in team_stats
            else {}
        ),
        **(
            {"offenseTouchdowns": team_stats["offense_touchdowns"]}
            if "offense_touchdowns" in team_stats
            else {}
        ),
    }
    
    # Calculate extended stats
    extended_stats = calculate_football_team_extended_stats(game, team, team_stats, opp_team_stats)
    
    return {**base_stats, **extended_stats}


def extract_football_player_stats(game, team_id, player_id, player_stats, league):
    """Extract football player stats from game data."""
    base_stats = {
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
    
    # Calculate extended stats
    extended_stats = calculate_football_player_extended_stats(base_stats)
    
    return {**base_stats, **extended_stats}