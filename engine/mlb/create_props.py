from shared.utils import setup_logger
import sys
from time import time

import statsapi
import numpy as np
from mlb.constants import N_GAMES, ABS_SIGMA_COEFF
from mlb.my_types import PlayerData
from mlb.prop_configs import get_mlb_stats_list

# New prop generation system imports
from mlb.prop_generator import MlbPropGenerator
from shared.db_session import get_db_session
from shared.date_utils import get_today_eastern
from shared.db_utils import (
    get_games_by_id,
    get_opposing_team_last_games,
    get_player_last_games,
    get_team_last_games,
    insert_prop,
)
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from shared.prop_generation.base import GameData
from shared.tables import MlbGames, Players, MlbPlayerStats

logger = setup_logger(__name__)


_league_mean_at_bats_cache = None


def get_league_at_bats_data(session: Session) -> tuple[float, float]:
    """Gets the mean at bats per game per hitter for the last n_games"""
    global _league_mean_at_bats_cache
    if _league_mean_at_bats_cache is None:
        at_bats = (
            session.execute(
                select(MlbPlayerStats.at_bats)
                .join(Players, Players.id == MlbPlayerStats.player_id)
                .join(MlbGames, MlbGames.id == MlbPlayerStats.game_id)
                .where(MlbPlayerStats.at_bats != 0)
                .where(Players.position != "Pitcher")
                .order_by(desc(MlbGames.game_date))
                .limit(N_GAMES)
            )
            .scalars()
            .all()
        )
        _league_mean_at_bats_cache = np.mean(at_bats), np.std(at_bats, ddof=1)
    return _league_mean_at_bats_cache


def is_prop_eligible(
    session: Session,
    metric: str,
    player: Players,
    probable_pitchers: list[str],
    mean_at_bats,
) -> bool:
    """Determine if a player is eligible for a prop based on their position."""
    # For pitchers, only allow pitching stats
    if player.position == "Pitcher":
        if metric in [
            "pitching_hits",
            "pitching_walks",
            "pitches_thrown",
            "earned_runs",
            "pitching_strikeouts",
        ]:
            return True
        else:
            logger.info(
                "Skip due to position incompatibility. Pitcher and not pitching stat."
            )
            return False

    # For two-way players, allow all stats
    if player.position == "Two-Way Player":
        if metric in [
            "pitching_hits",
            "pitching_walks",
            "pitches_thrown",
            "earned_runs",
            "pitching_strikeouts",
        ]:
            if player.name in probable_pitchers:
                return True
            return False
        return True

    # For batting stats, exclude pitchers
    if metric in ["hits", "home_runs", "doubles", "triples", "rbi", "strikeouts"]:
        if player.position == "Pitcher":
            logger.info(
                "Skip due to position incompatibility. Hitter stat and a pitcher."
            )
            return False

        league_mean_at_bats, league_sd_at_bats = get_league_at_bats_data(session)

        if mean_at_bats <= league_mean_at_bats + ABS_SIGMA_COEFF * league_sd_at_bats:
            logger.info(f"Skipping player {player.id}, due to low mean at bats.")
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
        if player.position != "Two-Way Player" and player.position != "Pitcher":
            logger.info(
                "Skip due to position incompatibility. Pitcher stat and not two-way or pitcher"
            )
            return False
        return True

    return True


def get_player_from_db(session, player_id: int) -> Players | None:
    """Fetch a player's information from the database."""
    from sqlalchemy import select

    try:
        query = select(Players).where(Players.id == player_id)
        result = session.execute(query).scalar_one_or_none()
        return result
    except Exception as e:
        logger.fatal(f"⚠️ Error fetching player {player_id}: {e}")
        sys.exit(1)


def get_game_players(
    session, game_id: int, probable_pitchers: list[str]
) -> list[Players]:
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

            for player_key, player_data in players_data.items():
                if not player_key.startswith("ID"):
                    continue
                player_id = int(player_key.replace("ID", ""))
                player_data = get_player_from_db(session, player_id)
                if player_data is not None:
                    if player_data.position != "Pitcher":
                        players.append(player_data)
                    else:
                        if player_data.name in probable_pitchers:
                            players.append(player_data)

        return players

    except Exception as e:
        logger.fatal(f"Getting players failed due to: {e}")
        sys.exit(1)


def main() -> None:
    """Main function to generate MLB props using the new prop generation system."""
    start = time()
    today = get_today_eastern()
    if len(sys.argv) == 2:
        today = sys.argv[1]
    logger.info("Fetching today's MLB games")

    # Get schedule for date range
    schedule = statsapi.schedule(start_date=today, end_date=today)
    logger.info(f"Found {len(schedule)} games")

    session = get_db_session()

    # Initialize the new prop generator
    prop_generator = MlbPropGenerator()

    try:
        player_data_list: list[PlayerData] = []
        team_games_cache: dict[str, list[MlbGames]] = {}
        total_props_generated = 0

        probable_pitchers_dict: dict[str, list[str]] = {}

        # Collect player data
        for i, game in enumerate(schedule):
            logger.info(
                f"Getting initial game data for game {game['game_id']} {i + 1}/{len(schedule)}"
            )

            probable_pitchers = [
                game["home_probable_pitcher"],
                game["away_probable_pitcher"],
            ]
            probable_pitchers_dict[game["game_id"]] = probable_pitchers

            home_team_id = int(game["home_id"])
            away_team_id = int(game["away_id"])
            players = get_game_players(
                session,
                game["game_id"],
                probable_pitchers,
            )

            for player in players:
                player_last_games = get_player_last_games(
                    session, player.id, "mlb", N_GAMES
                )

                matchup = ""
                if player.team_id == home_team_id:
                    matchup = away_team_id
                else:
                    matchup = home_team_id

                player_data_list.append(
                    {
                        "matchup": matchup,
                        "player": player,
                        "game_id": game["game_id"],
                        "last_games": player_last_games,
                        "game_start_time": game["game_datetime"],
                    }
                )

        # Process each player using new system
        for player_data in player_data_list:
            player = player_data["player"]
            logger.info(
                f"Processing player {player.name} {player.id} against team {player_data['matchup']}"
            )

            # Get available stats from auto-registration system
            available_stats = get_mlb_stats_list()

            probable_pitchers = probable_pitchers_dict[player_data["game_id"]]

            mean_at_bats = np.mean([game.at_bats for game in player_data["last_games"]])

            # Check stat eligibility
            stat_eligibility = {}
            for stat in available_stats:
                stat_eligibility[stat] = is_prop_eligible(
                    session=session,
                    metric=stat,
                    player=player,
                    probable_pitchers=probable_pitchers,
                    mean_at_bats=mean_at_bats,
                )

            # Skip if no props are eligible
            if not any(stat_eligibility.values()):
                logger.info(
                    f"🚨 Skipping player {player.name}, {player.id}. Not eligible by stats."
                )
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
            team_last_games = get_games_by_id(
                session, games_id_list, "mlb", sample_size
            )
            team_opp_games = get_opposing_team_last_games(
                session, games_id_list, "mlb", sample_size
            )

            # Create GameData object for new prop generation system
            game_data = GameData(
                player_games=player_data["last_games"],
                team_games=team_last_games,
                opponent_team_games=team_opp_games,
                matchup_team_games=matchup_last_games,
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
                                session=session,
                                line=line,
                                game_id=str(player_data["game_id"]),
                                player_id=player.id,
                                stat=stat,
                                game_start_time=player_data["game_start_time"],
                                league="mlb",
                                pick_options=pick_options,
                            )
                            total_props_generated += 1
                    except Exception as e:
                        logger.warning(f"⚠️ Error generating prop for {stat}: {e}")

        end = time()
        logger.info(
            f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
        )

    finally:
        session.close()


if __name__ == "__main__":
    main()
