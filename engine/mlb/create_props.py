import sys
from datetime import datetime
from time import time

import statsapi
from shared.db_session import get_db_session
from shared.db_utils import (
    get_games_by_id,
    get_opposing_team_last_games,
    get_player_last_games,
    get_team_last_games,
    insert_prop,
)
from shared.tables import Players, MlbGames
from mlb.constants import n_games
from mlb.my_types import PlayerData

# New prop generation system imports
from mlb.prop_generator import MlbPropGenerator
from mlb.prop_configs import get_mlb_stats_list
from shared.prop_generation.base import GameData


def is_prop_eligible(metric: str, position: str) -> bool:
    """Determine if a player is eligible for a prop based on their position."""
    # For pitchers, only allow pitching stats
    if position == "Pitcher":
        if metric in [
            "pitching_hits",
            "pitching_walks",
            "pitches_thrown",
            "earned_runs",
            "pitching_strikeouts",
        ]:
            return True
        else:
            print("Skip due to position incompatibility\n")
            return False

    # For two-way players, allow all stats
    if position == "Two-Way Player":
        return True

    # For batting stats, exclude pitchers
    if metric in ["hits", "home_runs", "doubles", "triples", "rbi", "strikeouts"]:
        if position == "Pitcher":
            print("Skip due to position incompatibility\n")
            return False
        return True

    # For pitching stats, only allow pitchers and two-way players
    if metric in [
        "pitching_hits",
        "pitching_walks",
        "pitches_thrown",
        "earned_runs",
        "pitching_strikeouts",
    ]:
        if position != "Two-Way Player" and position != "Pitcher":
            print("Skip due to position incompatibility\n")
            return False
        return True

    return True


def get_player_from_db(session, player_id: str) -> Players | None:
    """Fetch a player's information from the database."""
    from sqlalchemy import select
    try:
        query = select(Players).where(Players.id == player_id)
        result = session.execute(query).scalar_one_or_none()
        return result
    except Exception as e:
        print(f"⚠️ Error fetching player {player_id}: {e}")
        sys.exit(1)


def get_game_players(session, game_id: int, probable_pitchers: list[str]) -> list[Players]:
    """Get all eligible players for a specific MLB game."""
    try:
        game_data = statsapi.get("game", {"gamePk": game_id})
        boxscore = game_data["liveData"]["boxscore"]
        players = []

        teams_data = boxscore.get("teams", {})
        for team_side in ["away", "home"]:
            if team_side not in teams_data:
                continue

            team_data = teams_data[team_side]

            players_data = team_data.get("players", {})
            for player_key, _ in players_data.items():
                if not player_key.startswith("ID"):
                    continue
                player_id = player_key.replace("ID", "")
                if player_id in [str(id) for id in team_data["bench"]]:
                    print("Bench player skipped\n")
                    continue
                player_data = get_player_from_db(session, player_id)
                if player_data is not None:
                    if player_data.position != "Pitcher":
                        players.append(player_data)
                    else:
                        if player_data.name in probable_pitchers:
                            players.append(player_data)

        return players

    except Exception as e:
        print(f"Getting players failed due to: {e}")
        sys.exit(1)


def main() -> None:
    """Main function to generate MLB props using the new prop generation system."""
    start = time()
    today = datetime.today().strftime("%Y-%m-%d")
    if len(sys.argv) == 2:
        today = sys.argv[1]
    print("Fetching today's MLB games")

    # Get schedule for date range
    schedule = statsapi.schedule(start_date=today, end_date=today)
    print(f"Found {len(schedule)} games")

    session = get_db_session()
    
    # Initialize the new prop generator
    prop_generator = MlbPropGenerator()
    
    try:
        player_data_list: list[PlayerData] = []
        team_games_cache: dict[str, list[MlbGames]] = {}
        total_props_generated = 0

        # Collect player data
        for i, game in enumerate(schedule):
            print(f"Getting initial game data for game {game['game_id']} {i + 1}/{len(schedule)}\n")

            home_team_id = game["home_id"]
            away_team_id = game["away_id"]
            players = get_game_players(
                session,
                game["game_id"],
                [game["home_probable_pitcher"], game["away_probable_pitcher"]],
            )

            for player in players:
                player_last_games = get_player_last_games(
                    session, player.id, "mlb", n_games
                )

                matchup = ""
                if player.team_id == home_team_id:
                    matchup = away_team_id
                else:
                    matchup = home_team_id

                player_data_list.append({
                    "matchup": matchup,
                    "player": player,
                    "game_id": game["game_id"],
                    "last_games": player_last_games,
                    "game_start_time": game["game_datetime"],
                })

        # Process each player using new system
        for player_data in player_data_list:
            player = player_data["player"]
            print(f"Processing player {player.name} {player.id} against team {player_data['matchup']}\n")
            
            # Get available stats from auto-registration system
            available_stats = get_mlb_stats_list()
            
            # Check stat eligibility
            stat_eligibility = {}
            for stat in available_stats:
                stat_eligibility[stat] = is_prop_eligible(stat, player.position)

            # Skip if no props are eligible
            if not any(stat_eligibility.values()):
                print(f"🚨 Skipping player {player.name}, {player.id}. Not eligible by stats.\n")
                continue

            sample_size = len(player_data["last_games"])
            if sample_size == 0:
                continue

            # Get team game data
            if player_data["matchup"] not in team_games_cache:
                team_games_cache[player_data["matchup"]] = get_team_last_games(
                    session, player_data["matchup"], "mlb", sample_size
                )
            matchup_last_games = team_games_cache[player_data["matchup"]]

            games_id_list = [game.game_id for game in player_data["last_games"]]
            team_last_games = get_games_by_id(session, games_id_list, "mlb", sample_size)
            team_opp_games = get_opposing_team_last_games(
                session, games_id_list, "mlb", sample_size
            )

            # Create GameData object for new prop generation system
            game_data = GameData(
                player_games=player_data["last_games"],
                team_games=team_last_games,
                opponent_team_games=team_opp_games,
                matchup_team_games=matchup_last_games
            )

            # Generate props using new system
            for stat in available_stats:
                if stat_eligibility[stat]:
                    try:
                        line = prop_generator.generate_prop_for_stat(stat, game_data)
                        if line > 0:
                            # Determine pick options based on stat type
                            pick_options = []
                            if stat in [
                                "pitching_hits",
                                "earned_runs", 
                                "pitches_thrown",
                                "pitching_strikeouts",
                            ]:
                                pick_options.extend(["over", "under"])
                            else:
                                pick_options.append("over")
                                
                            insert_prop(
                                session,
                                line,
                                str(player_data["game_id"]),
                                player.id,
                                stat,
                                player_data["game_start_time"],
                                "mlb",
                                pick_options,
                            )
                            total_props_generated += 1
                    except Exception as e:
                        print(f"⚠️ Error generating prop for {stat}: {e}")

        end = time()
        print(f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated")
        
    finally:
        session.close()


if __name__ == "__main__":
    main()