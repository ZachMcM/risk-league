"""
Baseball statistics extraction and extended calculations.
"""


def calculate_baseball_batting_extended_stats(player_stats):
    """Calculate extended baseball batting statistics."""
    
    # Batting Average
    batting_avg = player_stats["hits"] / player_stats["atBats"] if player_stats["atBats"] > 0 else 0
    
    # On-Base Percentage
    plate_appearances = player_stats["atBats"] + player_stats["walks"] + player_stats["hitByPitch"]
    obp = (player_stats["hits"] + player_stats["walks"] + player_stats["hitByPitch"]) / plate_appearances if plate_appearances > 0 else 0
    
    # Slugging Percentage
    total_bases = (player_stats["singles"] + 
                   2 * player_stats["doubles"] + 
                   3 * player_stats["triples"] + 
                   4 * player_stats["homeRuns"])
    slugging_pct = total_bases / player_stats["atBats"] if player_stats["atBats"] > 0 else 0
    
    # OPS (On-base Plus Slugging)
    ops = obp + slugging_pct
    
    # Combination Stats
    hits_runs_rbis = player_stats["hits"] + player_stats["runs"] + player_stats["rbis"]
    
    return {
        "battingAvg": round(batting_avg, 4),
        "obp": round(obp, 4),
        "sluggingPct": round(slugging_pct, 4),
        "ops": round(ops, 4),
        "hitsRunsRbis": hits_runs_rbis,
    }


def calculate_baseball_pitching_extended_stats(player_stats):
    """Calculate extended baseball pitching statistics."""
    
    # ERA (Earned Run Average)
    era = (player_stats["earnedRuns"] * 9) / player_stats["inningsPitched"] if player_stats["inningsPitched"] > 0 else 0
    
    # WHIP (Walks + Hits per Inning Pitched)
    whip = (player_stats["hitsAllowed"] + player_stats["pitchingWalks"]) / player_stats["inningsPitched"] if player_stats["inningsPitched"] > 0 else 0
    
    # K/9 (Strikeouts per 9 innings)
    k_per_nine = (player_stats["pitchingStrikeouts"] * 9) / player_stats["inningsPitched"] if player_stats["inningsPitched"] > 0 else 0
    
    # Strike Percentage
    strike_pct = player_stats["strikes"] / player_stats["pitchesThrown"] if player_stats["pitchesThrown"] > 0 else 0
    
    return {
        "era": round(era, 2),
        "whip": round(whip, 2),
        "kPerNine": round(k_per_nine, 2),
        "strikePct": round(strike_pct, 4),
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
        "homeRunsAllowed": home_runs_allowed,
        "pitchingStrikeouts": pitching_strikeouts,
        "pitchingWalks": pitching_walks,
        "doublesAllowed": doubles_allowed,
        "hitsAllowed": hits_allowed,
        "triplesAllowed": triples_allowed,
        "runsAllowed": runs_allowed,
        "strikes": strikes,
        "pitchesThrown": pitches_thrown,
        "battingAvg": round(batting_avg, 4),
        "sluggingPct": round(slugging_pct, 4),
        "obp": round(obp, 4),
        "ops": round(ops, 4),
        "pitchingCaughtStealing": pitching_caught_stealing,
        "stolenBasesAllowed": stolen_bases_allowed,
        "earnedRuns": earned_runs,
    }


def extract_baseball_team_stats(game, team, league="MLB"):
    """Extract baseball team stats from game data."""
    team_stats = game["full_box"][team]["team_stats"]

    base_stats = {
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
    
    # Calculate extended stats
    extended_stats = calculate_baseball_team_extended_stats(game, team, team_stats)
    
    return {**base_stats, **extended_stats}


def extract_baseball_batting_stats(
    game, team_id, player_id, player_stats, league="MLB"
):
    """Extract baseball batting stats from game data."""
    base_stats = {
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
    
    # Calculate extended batting stats
    extended_stats = calculate_baseball_batting_extended_stats(base_stats)
    
    return {**base_stats, **extended_stats}


def extract_baseball_pitching_stats(
    game, team_id, player_id, player_stats, league="MLB"
):
    """Extract baseball pitching stats from game data."""
    base_stats = {
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
    
    # Calculate extended pitching stats
    extended_stats = calculate_baseball_pitching_extended_stats(base_stats)
    
    return {**base_stats, **extended_stats}