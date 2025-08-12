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


def extract_baseball_batting_stats(game, player_id, player_stats, league="MLB"):
    """Extract baseball batting stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
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
    }


def extract_baseball_pitching_stats(game, player_id, player_stats, league="MLB"):
    """Extract baseball pitching stats from game data."""
    return {
        "gameId": game["game_ID"],
        "playerId": int(player_id),
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
    }