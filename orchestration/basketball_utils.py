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
        "threePointsAttempted": team_stats["three_points_attempted"]
    }


def extract_basketball_player_stats(game, player_id, player_stats, league):
    """Extract basketball player stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
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
    }