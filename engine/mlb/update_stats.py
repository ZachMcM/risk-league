import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import statsapi
from dotenv import load_dotenv
from shared.tables import t_mlb_games, t_mlb_player_stats, t_players
from sqlalchemy import Engine, create_engine, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
import sys

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


def get_team_stats_from_boxscore(team_data):
    """Extract team stats from boxscore data"""
    team_stats = team_data.get("teamStats", {})

    batting_stats = team_stats.get("batting", {})
    pitching_stats = team_stats.get("pitching", {})
    fielding_stats = team_stats.get("fielding", {})

    return {
        # Batting stats
        "hits": batting_stats.get("hits", 0),
        "doubles": batting_stats.get("doubles", 0),
        "triples": batting_stats.get("triples", 0),
        "home_runs": batting_stats.get("homeRuns", 0),
        "rbi": batting_stats.get("rbi", 0),
        "stolen_bases": batting_stats.get("stolenBases", 0),
        "caught_stealing": batting_stats.get("caughtStealing", 0),
        "walks": batting_stats.get("baseOnBalls", 0),
        "strikeouts": batting_stats.get("strikeOuts", 0),
        "left_on_base": batting_stats.get("leftOnBase", 0),
        "batting_avg": float(batting_stats.get("avg", "0") or 0),
        "on_base_pct": float(batting_stats.get("obp", "0") or 0),
        "slugging_pct": float(batting_stats.get("slg", "0") or 0),
        "ops": float(batting_stats.get("ops", "0") or 0),
        "at_bats": batting_stats.get("atBats", 0),
        "plate_appearances": batting_stats.get("plateAppearances", 0),
        "total_bases": batting_stats.get("totalBases", 0),
        "hit_by_pitch": batting_stats.get("hitByPitch", 0),
        "sac_flies": batting_stats.get("sacFlies", 0),
        "sac_bunts": batting_stats.get("sacBunts", 0),
        # Pitching stats
        "innings_pitched": float(pitching_stats.get("inningsPitched", "0") or 0),
        "earned_runs": pitching_stats.get("earnedRuns", 0),
        "pitching_hits": pitching_stats.get("hits", 0),
        "pitching_home_runs": pitching_stats.get("homeRuns", 0),
        "pitching_walks": pitching_stats.get("baseOnBalls", 0),
        "pitching_strikeouts": pitching_stats.get("strikeOuts", 0),
        "era": float(pitching_stats.get("era", "0") or 0),
        "whip": float(pitching_stats.get("whip", "0") or 0),
        "pitches_thrown": pitching_stats.get("numberOfPitches", 0),
        "strikes": pitching_stats.get("strikes", 0),
        "balls": pitching_stats.get("balls", 0),
        # Fielding stats
        "errors": fielding_stats.get("errors", 0),
        "assists": fielding_stats.get("assists", 0),
        "putouts": fielding_stats.get("putOuts", 0),
        "fielding_chances": fielding_stats.get("chances", 0),
        "passed_balls": fielding_stats.get("passedBall", 0),
    }


def process_game_data(game, season):
    """Process a single game and return records for both teams"""
    game_id = str(game["game_id"])
    game_records = []

    try:
        # Get detailed game data
        game_data = statsapi.get("game", {"gamePk": game_id})

        if "liveData" not in game_data or "boxscore" not in game_data["liveData"]:
            print(f"No boxscore data for game {game_id}")
            return []

        boxscore = game_data["liveData"]["boxscore"]
        teams_data = boxscore.get("teams", {})

        # Get venue info
        venue_id = game_data.get("gameData", {}).get("venue", {}).get("id")
        venue_name = game_data.get("gameData", {}).get("venue", {}).get("name")

        # Process both teams
        for team_side in ["away", "home"]:
            if team_side not in teams_data:
                continue

            team_data = teams_data[team_side]
            team_info = team_data.get("team", {})
            team_id = str(team_info.get("id"))

            # Get opponent info
            opponent_side = "home" if team_side == "away" else "away"
            opponent_team_id = None
            if opponent_side in teams_data:
                opponent_team_id = str(
                    teams_data[opponent_side].get("team", {}).get("id")
                )

            # Get team stats
            team_stats = get_team_stats_from_boxscore(team_data)

            # Determine win/loss
            team_score = (
                game[f"{team_side}_score"] if f"{team_side}_score" in game else 0
            )
            opponent_score = (
                game[f"{opponent_side}_score"]
                if f"{opponent_side}_score" in game
                else 0
            )

            win_loss = None
            if game["status"] == "Final":
                if team_score > opponent_score:
                    win_loss = "W"
                elif team_score < opponent_score:
                    win_loss = "L"
                # Ties are rare in MLB but possible

            # Create game record
            game_record = {
                "id": f"{game_id}_{team_id}",
                "team_id": team_id,
                "game_date": game["game_datetime"],
                "game_type": game["game_type"],
                "venue_id": venue_id,
                "venue_name": venue_name,
                "opponent_team_id": opponent_team_id,
                "is_home": team_side == "home",
                "status": game["status"],
                "runs": team_score,
                "opponent_runs": opponent_score,
                "win_loss": win_loss,
                "season": season,
                **team_stats,
            }

            game_records.append(game_record)

    except Exception as e:
        print(f"Error processing game {game_id}: {e}")
        sys.exit(1)

    return game_records


def insert_games(games_df, engine):
    """Insert games data into database with upsert capability"""
    data = games_df.to_dict(orient="records")

    if not data:
        print("No data to insert.")
        return

    with engine.begin() as conn:
        try:
            # Use PostgreSQL's ON CONFLICT to handle duplicates
            stmt = pg_insert(t_mlb_games).values(data)

            # Define columns to update on conflict (exclude id and created_at)
            update_columns = {
                col.name: stmt.excluded[col.name]
                for col in t_mlb_games.columns
                if col.name not in ["id", "created_at"]
            }

            stmt = stmt.on_conflict_do_update(
                index_elements=["id"], set_=update_columns
            )

            result = conn.execute(stmt)
            print(f"✅ Upserted {len(data)} MLB game records")

        except Exception as e:
            print(f"🚨 Insert failed due to error: {e}")
            sys.exit(1)


def extract_player_batting_stats(batting_stats):
    """Extract batting stats from player boxscore data"""
    return {
        "at_bats": batting_stats.get("atBats", 0),
        "runs": batting_stats.get("runs", 0),
        "hits": batting_stats.get("hits", 0),
        "doubles": batting_stats.get("doubles", 0),
        "triples": batting_stats.get("triples", 0),
        "home_runs": batting_stats.get("homeRuns", 0),
        "rbi": batting_stats.get("rbi", 0),
        "stolen_bases": batting_stats.get("stolenBases", 0),
        "caught_stealing": batting_stats.get("caughtStealing", 0),
        "walks": batting_stats.get("baseOnBalls", 0),
        "strikeouts": batting_stats.get("strikeOuts", 0),
        "left_on_base": batting_stats.get("leftOnBase", 0),
        "hit_by_pitch": batting_stats.get("hitByPitch", 0),
        "sac_flies": batting_stats.get("sacFlies", 0),
        "sac_bunts": batting_stats.get("sacBunts", 0),
        "batting_avg": (
            float(batting_stats.get("avg"))
            if batting_stats.get("avg") is not None
            else None
        ),
        "on_base_pct": (
            float(batting_stats.get("obp"))
            if batting_stats.get("obp") is not None
            else None
        ),
        "slugging_pct": (
            float(batting_stats.get("slg"))
            if batting_stats.get("slg") is not None
            else None
        ),
        "ops": (
            float(batting_stats.get("ops"))
            if batting_stats.get("ops") is not None
            else None
        ),
    }


def extract_player_pitching_stats(pitching_stats):
    """Extract pitching stats from player boxscore data"""
    return {
        "innings_pitched": (
            float(pitching_stats.get("inningsPitched"))
            if pitching_stats.get("inningsPitched") is not None
            else None
        ),
        "pitching_hits": pitching_stats.get("hits", 0),
        "pitching_runs": pitching_stats.get("runs", 0),
        "earned_runs": pitching_stats.get("earnedRuns", 0),
        "pitching_walks": pitching_stats.get("baseOnBalls", 0),
        "pitching_strikeouts": pitching_stats.get("strikeOuts", 0),
        "pitching_home_runs": pitching_stats.get("homeRuns", 0),
        "pitches_thrown": pitching_stats.get("numberOfPitches", 0),
        "strikes": pitching_stats.get("strikes", 0),
        "balls": pitching_stats.get("balls", 0)
    }


def insert_player_stats(games_df, engine: Engine):
    """Insert games data into database with upsert capability"""
    data = games_df.to_dict(orient="records")

    if not data:
        print("No data to insert.")
        return

    with engine.begin() as conn:
        try:
            # Get existing MLB player IDs from database using SQLAlchemy
            existing_players_query = select(t_players.c.id).where(
                t_players.c.league == "mlb"
            )
            existing_players_result = conn.execute(existing_players_query)
            existing_player_ids = {row[0] for row in existing_players_result}

            # Set player_id to None for players that don't exist in the database
            players_set_to_null = 0
            for record in data:
                if record["player_id"] not in existing_player_ids:
                    record["player_id"] = None
                    players_set_to_null += 1

            if players_set_to_null > 0:
                print(
                    f"⚠️ Set {players_set_to_null} player_ids to null (players not found in database)"
                )

            # Use PostgreSQL's ON CONFLICT to handle duplicates
            stmt = pg_insert(t_mlb_player_stats).values(data)

            # Define columns to update on conflict (exclude id and created_at)
            update_columns = {
                col.name: stmt.excluded[col.name]
                for col in t_mlb_player_stats.columns
                if col.name not in ["id", "created_at"]
            }

            stmt = stmt.on_conflict_do_update(
                index_elements=["id"], set_=update_columns
            )

            conn.execute(stmt)
            print(f"✅ Upserted {len(data)} MLB player stats records")

        except IntegrityError as e:
            print(f"🚨 Insert failed due to error:", {e})
            sys.exit(1)


def process_player_stats_from_game(game_id, season):
    """Process player stats from a single game"""
    player_records = []

    try:
        # Get detailed game data
        game_data = statsapi.get("game", {"gamePk": game_id})

        if "liveData" not in game_data or "boxscore" not in game_data["liveData"]:
            print(f"No boxscore data for game {game_id}")
            return []

        boxscore = game_data["liveData"]["boxscore"]
        teams_data = boxscore.get("teams", {})

        # Process both teams
        for team_side in ["away", "home"]:
            if team_side not in teams_data:
                continue

            team_data = teams_data[team_side]

            players_data = team_data.get("players", {})
            batters = team_data.get("batters", [])
            pitchers = team_data.get("pitchers", [])

            # Process all players who appeared in the game
            for player_key, player_info in players_data.items():
                if not player_key.startswith("ID"):
                    continue

                player_id = player_key.replace("ID", "")
                stats_data = player_info.get("stats", {})

                # Determine if player is pitcher, batter, or both
                is_batter = int(player_id) in batters
                is_pitcher = int(player_id) in pitchers

                if not (is_batter or is_pitcher):
                    continue

                # Initialize player record
                player_record = {
                    "player_id": player_id,
                    "game_id": f"{game_id}_{team_data.get('team', {}).get('id')}",
                    "season": season,
                }

                # Extract batting stats if player batted
                if is_batter and "batting" in stats_data:
                    batting_stats = extract_player_batting_stats(stats_data["batting"])
                    player_record.update(batting_stats)
                else:
                    # Set batting stats to 0/None for pitchers who didn't bat
                    player_record.update(
                        {
                            "at_bats": None,
                            "runs": None,
                            "hits": None,
                            "doubles": None,
                            "triples": None,
                            "home_runs": None,
                            "rbi": None,
                            "stolen_bases": None,
                            "caught_stealing": None,
                            "walks": None,
                            "strikeouts": None,
                            "left_on_base": None,
                            "hit_by_pitch": None,
                            "sac_flies": None,
                            "sac_bunts": None,
                            "batting_avg": None,
                            "on_base_pct": None,
                            "slugging_pct": None,
                            "ops": None,
                        }
                    )

                # Extract pitching stats if player pitched
                if is_pitcher and "pitching" in stats_data:
                    pitching_stats = extract_player_pitching_stats(
                        stats_data["pitching"]
                    )
                    player_record.update(pitching_stats)
                else:
                    # Set pitching stats to 0/None for batters who didn't pitch
                    player_record.update(
                        {
                            "innings_pitched": None,
                            "pitching_hits": None,
                            "pitching_runs": None,
                            "earned_runs": None,
                            "pitching_walks": None,
                            "pitching_strikeouts": None,
                            "pitching_home_runs": None,
                            "pitches_thrown": None,
                            "strikes": None,
                            "balls": None,
                        }
                    )

                player_records.append(player_record)

    except Exception as e:
        print(f"Error processing player stats for game {game_id}: {e}")
        sys.exit(1)

    return player_records


def main():
    """Initialize MLB games data for a date range"""

    previous_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    print(f"Fetching MLB games from {previous_date}")

    # Get schedule for date range
    schedule = statsapi.schedule(start_date=previous_date, end_date=previous_date)
    print(f"Found {len(schedule)} games")

    all_game_records = []
    all_player_records = []

    for i, game in enumerate(schedule):
        print(
            f"Processing game and player stats {i+1}/{len(schedule)}: {game['summary']}"
        )

        # Only process completed games for now
        if game["status"] == "Final":
            game_records = process_game_data(game, datetime.now().year)
            all_game_records.extend(game_records)

            player_records = process_player_stats_from_game(
                game["game_id"], datetime.now().year
            )
            all_player_records.extend(player_records)

    # insert games
    if all_game_records:
        games_df = pd.DataFrame(all_game_records)

        # Remove duplicates based on ID (can happen with doubleheaders or data issues)
        initial_count = len(games_df)
        games_df = games_df.drop_duplicates(subset=["id"], keep="last")
        final_count = len(games_df)

        if initial_count != final_count:
            print(f"⚠️ Removed {initial_count - final_count} duplicate records")

        insert_games(games_df, engine)
    else:
        print("No completed games found to insert")

    # insert players
    if all_player_records:
        stats_df = pd.DataFrame(all_player_records)

        # Remove duplicates based on player_id and game_id
        initial_count = len(stats_df)
        stats_df = stats_df.drop_duplicates(
            subset=["player_id", "game_id"], keep="last"
        )
        final_count = len(stats_df)

        if initial_count != final_count:
            print(f"⚠️ Removed {initial_count - final_count} duplicate records")

        # Replace any remaining NaN values with None for proper database insertion
        stats_df = stats_df.where(pd.notna(stats_df), None)

        # Also replace any float('nan') values that might have slipped through

        stats_df = stats_df.replace([np.nan, float("nan")], None)

        insert_player_stats(stats_df, engine)
    else:
        print("No player stats found to insert")

    engine.dispose()


if __name__ == "__main__":
    main()
