"""
Football statistics extraction and extended calculations.
"""


def calculate_football_player_extended_stats(player_stats):
    """Calculate extended football player statistics."""

    # Passing efficiency stats
    completion_pct = (
        player_stats["completions"] / player_stats["passing_attempts"]
        if player_stats["passing_attempts"] > 0
        else 0
    )
    yards_per_attempt = (
        player_stats["passing_yards"] / player_stats["passing_attempts"]
        if player_stats["passing_attempts"] > 0
        else 0
    )
    yards_per_completion = (
        player_stats["passing_yards"] / player_stats["completions"]
        if player_stats["completions"] > 0
        else 0
    )

    # Rushing efficiency
    yards_per_carry = (
        player_stats["rushing_yards"] / player_stats["rushing_attempts"]
        if player_stats["rushing_attempts"] > 0
        else 0
    )

    # Receiving efficiency
    yards_per_reception = (
        player_stats["receiving_yards"] / player_stats["receptions"]
        if player_stats["receptions"] > 0
        else 0.0
    )

    # Field goal percentage
    field_goal_pct = (
        player_stats["field_goals_made"] / player_stats["field_goals_attempted"]
        if player_stats["field_goals_attempted"] > 0
        else 0.0
    )
    extra_point_pct = (
        player_stats["extra_points_made"] / player_stats["extra_points_attempted"]
        if player_stats["extra_points_attempted"] > 0
        else 0.0
    )

    # Combination stats
    receiving_rushing_touchdowns = (
        player_stats["receiving_touchdowns"] + player_stats["rushing_touchdowns"]
    )
    passing_rushing_touchdowns = (
        player_stats["passing_touchdowns"] + player_stats["rushing_touchdowns"]
    )
    total_yards = float(
        player_stats["passing_yards"]
        + player_stats["rushing_yards"]
        + player_stats["receiving_yards"]
    )

    return {
        "completion_pct": round(completion_pct, 4),
        "yards_per_attempt": round(yards_per_attempt, 2),
        "yards_per_completion": round(yards_per_completion, 2),
        "yards_per_carry": round(yards_per_carry, 2),
        "yards_per_reception": round(yards_per_reception, 2),
        "field_goal_pct": round(field_goal_pct, 4),
        "extra_point_pct": round(extra_point_pct, 4),
        "receiving_rushing_touchdowns": receiving_rushing_touchdowns,
        "passing_rushing_touchdowns": passing_rushing_touchdowns,
        "total_yards": round(total_yards, 2),
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
    passing_yards_allowed = team_stats.get(
        "total_passing_yards_allowed",
        sum(p.get("passing_yards", 0) for p in opp_player_stats),
    )
    rushing_yards_allowed = team_stats.get(
        "total_rushing_yards_allowed",
        sum(p.get("rushing_yards", 0) for p in opp_player_stats),
    )

    # Aggregate opponent completions from player stats
    completions_allowed = sum(p.get("completions", 0) for p in opp_player_stats)

    # Team touchdowns allowed (opponent's scoring)
    passing_touchdowns_allowed = opp_team_stats.get(
        "passing_touchdowns",
        sum(p.get("passing_touchdowns", 0) for p in opp_player_stats),
    )
    rushing_touchdowns_allowed = opp_team_stats.get(
        "rushing_touchdowns",
        sum(p.get("rushing_touchdowns", 0) for p in opp_player_stats),
    )

    return {
        "passing_yards_allowed": passing_yards_allowed,
        "completions_allowed": completions_allowed,
        "rushing_yards_allowed": rushing_yards_allowed,
        "passing_touchdowns_allowed": passing_touchdowns_allowed,
        "rushing_touchdowns_allowed": rushing_touchdowns_allowed,
    }


def extract_football_team_stats(game, team, league):
    """Extract football team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]

    # Get opponent team stats for extended calculations
    opp_team = "away_team" if team == "home_team" else "home_team"
    opp_team_stats = game["full_box"][opp_team]["team_stats"]

    team_player_stats = []
    if "player_box" in game and team in game["player_box"]:
        for _, player_stats in game["player_box"][team].items():
            team_player_stats.append(player_stats)

    base_stats = {
        "game_id": game["game_ID"],
        "team_id": game["full_box"][team]["team_id"],
        "league": league,
        "score": game["full_box"][team]["score"],
        "sacks": team_stats.get("sacks", 0),
        "safeties": team_stats.get("safeties", 0),
        "penalties_total": team_stats.get("penalties", {}).get("total", 0),
        "penalties_yards": team_stats.get("penalties", {}).get("yards", 0),
        "turnovers": team_stats.get("turnovers", 0),
        "first_downs": team_stats.get("first_downs", 0),
        "total_yards": team_stats.get("total_yards", 0),
        "blocked_kicks": team_stats.get("blocked_kicks", 0),
        "blocked_punts": team_stats.get("blocked_punts", 0),
        "kicks_blocked": team_stats.get("kicksBlocked", 0),
        "passing_yards": team_stats.get("passing_yards", 0),
        "punts_blocked": team_stats.get("punts_blocked", 0),
        "rushing_yards": team_stats.get("rushing_yards", 0),
        "defense_touchdowns": team_stats.get("defensive_touchdowns", 0),
        "defense_interceptions": team_stats.get("defensive_interceptions", 0),
        "kick_return_touchdowns": team_stats.get("kick_return_touchdowns", 0),
        "punt_return_touchdowns": team_stats.get("punt_return_touchdowns", 0),
        "blocked_kick_touchdowns": team_stats.get("blocked_kick_touchdowns", 0),
        "blocked_punt_touchdowns": team_stats.get("blocked_punt_touchdowns", 0),
        "interception_touchdowns": team_stats.get("interception_touchdowns", 0),
        "fumble_return_touchdowns": team_stats.get("fumble_return_touchdowns", 0),
        "defense_fumble_recoveries": team_stats.get("defense_fumble_recoveries", 0),
        "field_goal_return_touchdowns": team_stats.get(
            "field_goal_return_touchdowns", 0
        ),
        "two_point_conversion_returns": team_stats.get(
            "two_point_conversion_returns", 0
        ),
        "two_point_conversion_attempts": team_stats.get(
            "two_point_conversion_attempts", 0
        ),
        "completions": team_stats.get(
            "completions", sum(p.get("completions", 0) for p in team_player_stats)
        ),
        "passing_touchdowns": team_stats.get(
            "passing_touchdowns",
            sum(p.get("passing_touchdowns", 0) for p in team_player_stats),
        ),
        "rushing_touchdowns": team_stats.get(
            "rushing_touchdowns",
            sum(p.get("rushing_touchdowns", 0) for p in team_player_stats),
        ),
        "two_point_conversion_succeeded": team_stats.get("two_point_conversion_succeeded", 0),
        "points_against_defense_special_teams": team_stats.get("points_against_defense_special_teams", 0)
    }

    # Calculate extended stats
    extended_stats = calculate_football_team_extended_stats(
        game, team, team_stats, opp_team_stats
    )

    return {**base_stats, **extended_stats}


def extract_football_player_stats(game, team_id, player_id, player_stats, league):
    """Extract football player stats from game data."""
    base_stats = {
        "game_id": game["game_ID"],
        "player_id": int(player_id),
        "league": league,
        "team_id": int(team_id),
        "completions": player_stats.get("completions", 0),
        "fumbles_lost": player_stats.get("fumbles_lost", 0),
        "rushing_long": player_stats.get("rushing_long", 0.0),
        "passer_rating": player_stats.get("passer_rating", 0.0),
        "passing_yards": player_stats.get("passing_yards", 0.0),
        "rushing_yards": player_stats.get("rushing_yards", 0.0),
        "passing_attempts": player_stats.get("passing_attempts", 0),
        "rushing_attempts": player_stats.get("rushing_attempts", 0),
        "fumble_recoveries": player_stats.get("fumble_recoveries", 0),
        "passing_touchdowns": player_stats.get("passing_touchdowns", 0),
        "rushing_touchdowns": player_stats.get("rushing_touchdowns", 0),
        "passing_interceptions": player_stats.get("passing_interceptions", 0),
        "receiving_long": player_stats.get("receiving_long", 0.0),
        "receiving_yards": player_stats.get("receiving_yards", 0),
        "receiving_touchdowns": player_stats.get("receiving_touchdowns", 0),
        "receptions": player_stats.get("receptions", 0),
        "field_goals_attempted": player_stats.get("field_goals_attempted", 0),
        "field_goals_made": player_stats.get("field_goals_made", 0),
        "field_goals_long": player_stats.get("field_goals_long", 0.0),
        "extra_points_attempted": player_stats.get("extra_points_attempted", 0),
        "extra_points_made": player_stats.get("extra_points_made", 0),
        "status": player_stats.get("status", "INACT"),
    }

    # Calculate extended stats
    extended_stats = calculate_football_player_extended_stats(base_stats)

    return {**base_stats, **extended_stats}
