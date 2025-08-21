"""
Basketball statistics extraction and extended calculations.
"""

from time_utils import convert_minutes_to_decimal


def calculate_basketball_player_extended_stats(player_stats, team_stats, opp_team_stats, all_team_players_minutes=240):
    """Calculate extended basketball player statistics."""
    
    # True Shooting Percentage
    ts_denominator = 2 * (player_stats["fieldGoalsAttempted"] + 0.44 * player_stats["freeThrowsAttempted"])
    true_shooting_pct = player_stats["points"] / ts_denominator if ts_denominator > 0 else 0
    
    # Usage Rate
    team_fga_fta_to = team_stats["field_goals_attempted"] + 0.44 * team_stats["free_throws_attempted"] + team_stats["turnovers"]
    player_fga_fta_to = player_stats["fieldGoalsAttempted"] + 0.44 * player_stats["freeThrowsAttempted"] + player_stats["turnovers"]
    
    usage_rate = 0
    if player_stats["minutes"] > 0 and team_fga_fta_to > 0:
        usage_rate = 100 * ((player_fga_fta_to * (all_team_players_minutes / 5)) / (player_stats["minutes"] * team_fga_fta_to))
    
    # Rebound Percentage
    total_rebounds = team_stats["total_rebounds"] + opp_team_stats["total_rebounds"]
    rebounds_pct = 0
    if player_stats["minutes"] > 0 and total_rebounds > 0:
        rebounds_pct = 100 * (player_stats["rebounds"] * (all_team_players_minutes / 5)) / (player_stats["minutes"] * total_rebounds)
    
    # Assist Percentage
    team_field_goals = team_stats["field_goals_made"] - player_stats["fieldGoalsMade"]
    assists_pct = 0
    if player_stats["minutes"] > 0 and team_field_goals > 0:
        assists_pct = 100 * player_stats["assists"] / ((player_stats["minutes"] / (all_team_players_minutes / 5)) * team_field_goals)
    
    # Block Percentage
    opp_two_point_attempts = opp_team_stats["field_goals_attempted"] - opp_team_stats["three_points_attempted"]
    blocks_pct = 0
    if player_stats["minutes"] > 0 and opp_two_point_attempts > 0:
        blocks_pct = 100 * (player_stats["blocks"] * (all_team_players_minutes / 5)) / (player_stats["minutes"] * opp_two_point_attempts)
    
    # Steal Percentage (estimate opponent possessions)
    opp_possessions = opp_team_stats["field_goals_attempted"] - opp_team_stats.get("offensive_rebounds", 0) + opp_team_stats["turnovers"] + 0.44 * opp_team_stats["free_throws_attempted"]
    steals_pct = 0
    if player_stats["minutes"] > 0 and opp_possessions > 0:
        steals_pct = 100 * (player_stats["steals"] * (all_team_players_minutes / 5)) / (player_stats["minutes"] * opp_possessions)
    
    # Three Point Percentage
    three_pct = player_stats["threePointsMade"] / player_stats["threePointsAttempted"] if player_stats["threePointsAttempted"] > 0 else 0
    
    # Free Throw Percentage
    free_throw_pct = player_stats["freeThrowsMade"] / player_stats["freeThrowsAttempted"] if player_stats["freeThrowsAttempted"] > 0 else 0
    
    # Combination Stats
    points_rebounds_assists = player_stats["points"] + player_stats["rebounds"] + player_stats["assists"]
    points_rebounds = player_stats["points"] + player_stats["rebounds"]
    points_assists = player_stats["points"] + player_stats["assists"]
    rebounds_assists = player_stats["rebounds"] + player_stats["assists"]
    
    return {
        "trueShootingPct": round(true_shooting_pct, 4),
        "usageRate": round(usage_rate, 2),
        "reboundsPct": round(rebounds_pct, 2),
        "assistsPct": round(assists_pct, 2),
        "blocksPct": round(blocks_pct, 2),
        "stealsPct": round(steals_pct, 2),
        "threePct": round(three_pct, 4),
        "freeThrowPct": round(free_throw_pct, 4),
        "pointsReboundsAssists": points_rebounds_assists,
        "pointsRebounds": points_rebounds,
        "pointsAssists": points_assists,
        "reboundsAssists": rebounds_assists,
    }


def calculate_basketball_team_extended_stats(game, team, team_stats, opp_team_stats):
    """Calculate extended basketball team statistics."""
    
    opp_team = "away_team" if team == "home_team" else "home_team"

    # Get all player stats for team minutes calculation
    team_player_stats = []
    if "player_box" in game and team in game["player_box"]:
        for _, player_stats in game["player_box"][team].items():
            team_player_stats.append(player_stats)
    
    # Calculate team minutes from all players
    team_minutes = sum(
        convert_minutes_to_decimal(p.get("minutes", "0:00"))
        for p in team_player_stats
    )
    
    # Estimate possessions (matches server calculation)
    team_possessions = (
        team_stats["field_goals_attempted"] -
        team_stats["offensive_rebounds"] +
        team_stats["turnovers"] +
        0.44 * team_stats["free_throws_attempted"]
    )
    
    opp_possessions = (
        opp_team_stats["field_goals_attempted"] -
        opp_team_stats["offensive_rebounds"] +
        opp_team_stats["turnovers"] +
        0.44 * opp_team_stats["free_throws_attempted"]
    )
    
    # Pace calculation (matches server formula)
    pace = (48 * (team_possessions + opp_possessions)) / (2 * (team_minutes / 5)) if team_minutes > 0 else 0
    
    # Offensive Rating (points per 100 possessions)
    offensive_rating = 100 * game["full_box"][team]["score"] / team_possessions if team_possessions > 0 else 0
    
    # Defensive Rating (opponent points per 100 possessions)
    defensive_rating = 100 * game["full_box"][opp_team]["score"] / opp_possessions if opp_possessions > 0 else 0
    
    return {
        "pace": round(pace, 2),
        "offensiveRating": round(offensive_rating, 2),
        "defensiveRating": round(defensive_rating, 2),
    }


def extract_basketball_team_stats(game, team, league):
    """Extract basketball team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]
    
    # Get opponent team stats for extended calculations
    opp_team = "away_team" if team == "home_team" else "home_team"
    opp_team_stats = game["full_box"][opp_team]["team_stats"]

    base_stats = {
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
    
    # Calculate extended stats
    extended_stats = calculate_basketball_team_extended_stats(game, team, team_stats, opp_team_stats)
    
    return {**base_stats, **extended_stats}


def extract_basketball_player_stats(game, team_id, player_id, player_stats, league):
    """Extract basketball player stats from game data."""
    
    # Determine which team this player is on
    team_key = None
    if str(team_id) == str(game["full_box"]["home_team"]["team_id"]):
        team_key = "home_team"
    elif str(team_id) == str(game["full_box"]["away_team"]["team_id"]):
        team_key = "away_team"
    
    # Get team and opponent stats for extended calculations
    if team_key:
        team_stats = game["full_box"][team_key]["team_stats"]
        opp_team_key = "away_team" if team_key == "home_team" else "home_team"
        opp_team_stats = game["full_box"][opp_team_key]["team_stats"]
    else:
        # Fallback if team matching fails
        team_stats = game["full_box"]["home_team"]["team_stats"]
        opp_team_stats = game["full_box"]["away_team"]["team_stats"]

    base_stats = {
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
        "status": player_stats.get("status", "INACT"),
    }
    
    # Calculate extended stats
    extended_stats = calculate_basketball_player_extended_stats(base_stats, team_stats, opp_team_stats)
    
    return {**base_stats, **extended_stats}