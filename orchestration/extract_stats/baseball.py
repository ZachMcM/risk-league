"""
Baseball statistics extraction and extended calculations.
"""

from db.stats.baseball import BaseballPlayerStats, BaseballTeamStats


def calculate_baseball_batting_extended_stats(player_stats):
    """Calculate extended baseball batting statistics."""

    # Batting Average
    batting_avg = player_stats["hits"] / player_stats["at_bats"] if player_stats["at_bats"] > 0 else 0

    # On-Base Percentage
    plate_appearances = player_stats["at_bats"] + player_stats["walks"] + player_stats["hit_by_pitch"]
    obp = (player_stats["hits"] + player_stats["walks"] + player_stats["hit_by_pitch"]) / plate_appearances if plate_appearances > 0 else 0

    # Slugging Percentage
    total_bases = (player_stats["singles"] +
                   2 * player_stats["doubles"] +
                   3 * player_stats["triples"] +
                   4 * player_stats["home_runs"])
    slugging_pct = total_bases / player_stats["at_bats"] if player_stats["at_bats"] > 0 else 0

    # OPS (On-base Plus Slugging)
    ops = obp + slugging_pct

    # Combination Stats
    hits_runs_rbis = player_stats["hits"] + player_stats["runs"] + player_stats["rbis"]

    return {
        "batting_avg": round(batting_avg, 4),
        "obp": round(obp, 4),
        "slugging_pct": round(slugging_pct, 4),
        "ops": round(ops, 4),
        "hits_runs_rbis": hits_runs_rbis,
    }


def calculate_baseball_pitching_extended_stats(player_stats):
    """Calculate extended baseball pitching statistics."""

    # ERA (Earned Run Average)
    era = (player_stats["earned_runs"] * 9) / player_stats["innings_pitched"] if player_stats["innings_pitched"] > 0 else 0

    # WHIP (Walks + Hits per Inning Pitched)
    whip = (player_stats["hits_allowed"] + player_stats["pitching_walks"]) / player_stats["innings_pitched"] if player_stats["innings_pitched"] > 0 else 0

    # K/9 (Strikeouts per 9 innings)
    k_per_nine = (player_stats["pitching_strikeouts"] * 9) / player_stats["innings_pitched"] if player_stats["innings_pitched"] > 0 else 0

    # Strike Percentage
    strike_pct = player_stats["strikes"] / player_stats["pitches_thrown"] if player_stats["pitches_thrown"] > 0 else 0

    return {
        "era": round(era, 2),
        "whip": round(whip, 2),
        "k_per_nine": round(k_per_nine, 2),
        "strike_pct": round(strike_pct, 4),
    }


def calculate_baseball_team_extended_stats(game, team, team_stats):
    """Calculate extended baseball team statistics by aggregating player stats."""
    
    # Get opponent team stats for "allowed" stats
    opp_team = "away_team" if team == "home_team" else "home_team"
    opp_team_stats = game["full_box"][opp_team]["team_stats"]
    
    # Get opponent batting stats for "allowed" calculations
    opp_batting_stats = []
    if "player_box" in game and opp_team in game["player_box"] and "batting" in game["player_box"][opp_team]:
        for _, player_stats in game["player_box"][opp_team]["batting"].items():
            opp_batting_stats.append(player_stats)
    
    # Get this team's pitching stats for aggregation
    team_pitching_stats = []
    if "player_box" in game and team in game["player_box"] and "pitching" in game["player_box"][team]:
        for _, player_stats in game["player_box"][team]["pitching"].items():
            team_pitching_stats.append(player_stats)
    
    # Get this team's batting stats for hit by pitch calculation
    team_batting_stats = []
    if "player_box" in game and team in game["player_box"] and "batting" in game["player_box"][team]:
        for _, player_stats in game["player_box"][team]["batting"].items():
            team_batting_stats.append(player_stats)
    
    # "Allowed" stats come from opponent's offensive performance
    home_runs_allowed = opp_team_stats["HR"]
    doubles_allowed = opp_team_stats["2B"] 
    hits_allowed = opp_team_stats["H"]
    triples_allowed = opp_team_stats["3B"]
    runs_allowed = opp_team_stats["R"]
    stolen_bases_allowed = opp_team_stats["SB"]
    
    # Team pitching stats aggregated from players
    pitching_strikeouts = sum(p.get("K", 0) for p in team_pitching_stats)
    pitching_walks = sum(p.get("BB", 0) for p in team_pitching_stats)
    strikes = sum(p.get("strikes", 0) for p in team_pitching_stats)
    pitches_thrown = sum(p.get("pitches", 0) for p in team_pitching_stats)
    pitching_caught_stealing = sum(p.get("CS", 0) for p in team_pitching_stats)
    earned_runs = sum(p.get("ER", 0) for p in team_pitching_stats)
    
    # Calculate team batting stats
    batting_avg = team_stats["H"] / team_stats["AB"] if team_stats["AB"] > 0 else 0
    
    # Calculate singles (hits - extra base hits)
    singles = team_stats["H"] - team_stats["2B"] - team_stats["3B"] - team_stats["HR"]
    
    # Slugging percentage
    total_bases = singles + 2 * team_stats["2B"] + 3 * team_stats["3B"] + 4 * team_stats["HR"]
    slugging_pct = total_bases / team_stats["AB"] if team_stats["AB"] > 0 else 0
    
    # On-base percentage (need hit by pitch from batting stats)
    hit_by_pitch = sum(p.get("HBP", 0) for p in team_batting_stats)
    plate_appearances = team_stats["AB"] + team_stats["BB"] + hit_by_pitch
    obp = (team_stats["H"] + team_stats["BB"] + hit_by_pitch) / plate_appearances if plate_appearances > 0 else 0
    
    # OPS
    ops = slugging_pct + obp
    
    return {
        "home_runs_allowed": home_runs_allowed,
        "pitching_strikeouts": pitching_strikeouts,
        "pitching_walks": pitching_walks,
        "doubles_allowed": doubles_allowed,
        "hits_allowed": hits_allowed,
        "triples_allowed": triples_allowed,
        "runs_allowed": runs_allowed,
        "strikes": strikes,
        "pitches_thrown": pitches_thrown,
        "batting_avg": round(batting_avg, 4),
        "slugging_pct": round(slugging_pct, 4),
        "on_base_percentage": round(obp, 4),
        "ops": round(ops, 4),
        "pitching_caught_stealing": pitching_caught_stealing,
        "stolen_bases_allowed": stolen_bases_allowed,
        "earned_runs": earned_runs,
    }


def extract_baseball_team_stats(game, team, league="MLB"):
    """Extract baseball team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]

    base_stats = {
        "game_id": game["game_ID"],
        "team_id": game["full_box"][team]["team_id"],
        "league": league,
        "errors": team_stats["E"],
        "hits": team_stats["H"],
        "runs": team_stats["R"],
        "doubles": team_stats["2B"],
        "triples": team_stats["3B"],
        "at_bats": team_stats["AB"],
        "walks": team_stats["BB"],
        "caught_stealing": team_stats["CS"],
        "home_runs": team_stats["HR"],
        "stolen_bases": team_stats["SB"],
        "strikeouts": team_stats["SO"],
        "rbis": team_stats["RBI"],
    }
    
    # Calculate extended stats
    extended_stats = calculate_baseball_team_extended_stats(game, team, team_stats)
    
    return {**base_stats, **extended_stats}


def extract_baseball_batting_stats(
    game, team_id, player_id, player_stats, league="MLB"
):
    """Extract baseball batting stats from game data."""
    base_stats = {
        "game_id": game["game_ID"],
        "player_id": int(player_id),
        "team_id": int(team_id),
        "league": league,
        "errors": player_stats.get("E", 0),
        "hits": player_stats.get("H", 0),
        "runs": player_stats.get("R", 0),
        "singles": player_stats.get("1B", 0),
        "doubles": player_stats.get("2B", 0),
        "triples": player_stats.get("3B", 0),
        "at_bats": player_stats.get("AB", 0),
        "walks": player_stats.get("BB", 0),
        "caught_stealing": player_stats.get("CS", 0),
        "home_runs": player_stats.get("HR", 0),
        "putouts": player_stats.get("PO", 0),
        "stolen_bases": player_stats.get("SB", 0),
        "strikeouts": player_stats.get("SO", 0),
        "hit_by_pitch": player_stats.get("HBP", 0),
        "intentional_walks": player_stats.get("IBB", 0),
        "rbis": player_stats.get("RBI", 0),
        "outs": player_stats.get("Outs", 0),
        "status": player_stats.get("status", "INACT"),
    }
    
    # Calculate extended batting stats
    extended_stats = calculate_baseball_batting_extended_stats(base_stats)
    
    return {**base_stats, **extended_stats}


def extract_baseball_pitching_stats(
    game, team_id, player_id, player_stats, league="MLB"
):
    """Extract baseball pitching stats from game data."""
    base_stats = {
        "game_id": game["game_ID"],
        "player_id": int(player_id),
        "team_id": int(team_id),
        "league": league,
        "hits_allowed": player_stats.get("H", 0),
        "pitching_strikeouts": player_stats.get("K", 0),
        "losses": player_stats.get("L", 0),
        "runs_allowed": player_stats.get("R", 0),
        "saves": player_stats.get("S", 0),
        "wins": player_stats.get("W", 0),
        "singles_allowed": player_stats.get("1B", 0),
        "doubles_allowed": player_stats.get("2B", 0),
        "triples_allowed": player_stats.get("3B", 0),
        "pitching_walks": player_stats.get("BB", 0),
        "balks": player_stats.get("BK", 0),
        "blown_saves": player_stats.get("BS", 0),
        "pitching_caught_stealing": player_stats.get("CS", 0),
        "earned_runs": player_stats.get("ER", 0),
        "home_runs_allowed": player_stats.get("HR", 0),
        "innings_pitched": player_stats.get("IP", 0),
        "pitching_putouts": player_stats.get("PO", 0),
        "stolen_bases_allowed": player_stats.get("SB", 0),
        "wild_pitches": player_stats.get("WP", 0),
        "pitching_hit_by_pitch": player_stats.get("HBP", 0),
        "holds": player_stats.get("HLD", 0),
        "pitching_intentional_walks": player_stats.get("IBB", 0),
        "pitches_thrown": player_stats.get("pitches", 0),
        "strikes": player_stats.get("strikes", 0),
        "status": player_stats.get("status", "INACT"),
    }
    
    # Calculate extended pitching stats
    extended_stats = calculate_baseball_pitching_extended_stats(base_stats)
    
    return {**base_stats, **extended_stats}