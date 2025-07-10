from shared.utils import setup_logger
import sys
from datetime import datetime

from shared.my_types import Leagues
from shared.pubsub_utils import publish_message
from shared.tables import (
    MlbGames,
    MlbPlayerStats,
    NbaGames,
    NbaPlayerStats,
    Players,
    Props,
)
from sqlalchemy import and_, desc, or_, select
from sqlalchemy.orm import Session

logger = setup_logger(__name__)


def get_player_last_games(
    session: Session, player_id: str, league: Leagues, n_games: int
) -> list[MlbPlayerStats | NbaPlayerStats]:
    """Retrieve the last n games for a specific player.

    Args:
        session: SQLAlchemy database session
        player_id: ID of the player
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of player stats from the last n games
    """
    try:
        if league == "mlb":
            query = (
                select(MlbPlayerStats)
                .join(MlbGames, MlbPlayerStats.game_id == MlbGames.id)
                .where(MlbPlayerStats.player_id == player_id)
                .where(or_(MlbGames.game_type == "R", MlbGames.game_type == "P"))
                .order_by(desc(MlbGames.game_date))
                .limit(n_games)
            )
        elif league == "nba":
            query = (
                select(NbaPlayerStats)
                .join(NbaGames, NbaPlayerStats.game_id == NbaGames.id)
                .where(NbaPlayerStats.player_id == player_id)
                .where(
                    or_(
                        NbaGames.game_type == "regular_season",
                        NbaGames.game_type == "playoffs",
                    )
                )
                .order_by(desc(NbaGames.game_date))
                .limit(n_games)
            )
        else:
            raise ValueError(f"Invalid league: {league}")

        result = session.execute(query).scalars().all()
        return list(result)

    except Exception as e:
        logger.fatal(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


def get_team_last_games(
    session: Session, team_id: str, league: Leagues, n_games: int
) -> list[MlbGames | NbaGames]:
    """Get the last n games for a team.

    Args:
        session: SQLAlchemy database session
        team_id: ID of the team
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of team game records from the last n games
    """
    try:
        if league == "mlb":
            query = (
                select(MlbGames)
                .where(MlbGames.team_id == str(team_id))
                .where(or_(MlbGames.game_type == "R", MlbGames.game_type == "P"))
                .order_by(desc(MlbGames.game_date))
                .limit(n_games)
            )
        elif league == "nba":
            query = (
                select(NbaGames)
                .where(NbaGames.team_id == str(team_id))
                .where(
                    or_(
                        NbaGames.game_type == "regular_season",
                        NbaGames.game_type == "playoffs",
                    )
                )
                .order_by(desc(NbaGames.game_date))
                .limit(n_games)
            )
        else:
            raise ValueError(f"Invalid league: {league}")

        result = session.execute(query).scalars().all()
        return list(result)

    except Exception as e:
        logger.fatal(f"⚠️ There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)


def get_opposing_team_last_games(
    session: Session, id_list: list[str], league: Leagues, n_games: int
) -> list[MlbGames | NbaGames]:
    """Get opposing team games from a list of game IDs.

    Args:
        session: SQLAlchemy database session
        id_list: List of game IDs
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of opposing team game records
    """
    conditions = []
    for game_id in id_list:
        if league == "nba":
            raw_game_id, _ = game_id.split("-")
            game_prefix = f"{raw_game_id}-"
            conditions.append(
                and_(
                    NbaGames.id.startswith(game_prefix),
                    NbaGames.id != game_id,
                )
            )
        elif league == "mlb":
            raw_game_id, _ = game_id.split("_")
            game_prefix = f"{raw_game_id}_"
            conditions.append(
                and_(
                    MlbGames.id.startswith(game_prefix),
                    MlbGames.id != game_id,
                )
            )

    try:
        if league == "mlb":
            query = (
                select(MlbGames)
                .where(or_(*conditions))
                .where(or_(MlbGames.game_type == "R", MlbGames.game_type == "P"))
                .order_by(desc(MlbGames.game_date))
                .limit(n_games)
            )
        elif league == "nba":
            query = (
                select(NbaGames)
                .where(or_(*conditions))
                .where(
                    or_(
                        NbaGames.game_type == "regular_season",
                        NbaGames.game_type == "playoffs",
                    )
                )
                .order_by(desc(NbaGames.game_date))
                .limit(n_games)
            )
        else:
            raise ValueError(f"Invalid league: {league}")

        result = session.execute(query).scalars().all()
        return list(result)

    except Exception as e:
        logger.fatal(f"⚠️ There was an error fetching opposing team games {e}")
        sys.exit(1)


def get_players_from_team(session: Session, team_id: str) -> list[Players]:
    """Get a list of all players from a team.

    Args:
        session: SQLAlchemy database session
        team_id: ID of the team

    Returns:
        List of Player objects from the team
    """
    try:
        query = select(Players).where(Players.team_id == str(team_id))
        result = session.execute(query).scalars().all()
        return list(result)

    except Exception as e:
        logger.fatal(f"⚠️ Error fetching roster for team {team_id}: {e}")
        sys.exit(1)


def get_games_by_id(
    session: Session, id_list: list[str], league: Leagues, n_games: int
) -> list[MlbGames | NbaGames]:
    """Retrieve games by their IDs.

    Args:
        session: SQLAlchemy database session
        id_list: List of game IDs
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of game records matching the provided IDs
    """
    try:
        if league == "nba":
            query = (
                select(NbaGames)
                .where(NbaGames.id.in_(id_list))
                .where(
                    or_(
                        NbaGames.game_type == "regular_season",
                        NbaGames.game_type == "playoffs",
                    )
                )
                .order_by(desc(NbaGames.game_date))
                .limit(n_games)
            )
        elif league == "mlb":
            query = (
                select(MlbGames)
                .where(MlbGames.id.in_(id_list))
                .where(or_(MlbGames.game_type == "P", MlbGames.game_type == "R"))
                .order_by(desc(MlbGames.game_date))
                .limit(n_games)
            )
        else:
            raise ValueError(f"Invalid league: {league}")

        result = session.execute(query).scalars().all()
        return list(result)

    except Exception as e:
        logger.fatal(f"⚠️ There was an error fetching games by id, {e}")
        sys.exit(1)


def insert_prop(
    session: Session,
    line: float,
    game_id: str,
    player_id: str,
    stat: str,
    game_start_time: datetime,
    league: Leagues,
    pick_options: list[str] = None,
) -> None:
    """Insert a prop into the database.

    Args:
        session: SQLAlchemy database session
        line: The prop line/threshold value
        game_id: ID of the game
        player_id: ID of the player
        stat: The stat being predicted
        game_start_time: When the game starts
        league: League type ("mlb" or "nba")
        pick_options: Available pick options (default: ["over", "under"])
    """
    if pick_options is None:
        pick_options = ["over", "under"]

    try:
        # Check if prop already exists
        existing_prop = session.execute(
            select(Props).where(
                Props.raw_game_id == game_id,
                Props.player_id == player_id,
                Props.stat == stat,
                Props.league == league,
            )
        ).scalar_one_or_none()

        if existing_prop:
            # Update existing prop
            existing_prop.line = line
            existing_prop.game_start_time = game_start_time
            existing_prop.pick_options = pick_options
        else:
            # Create new prop
            new_prop = Props(
                line=line,
                raw_game_id=game_id,
                player_id=player_id,
                stat=stat,
                game_start_time=game_start_time,
                league=league,
                pick_options=pick_options,
            )
            session.add(new_prop)

        session.commit()

    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ There was an error inserting the prop, {e}")
        sys.exit(1)


def update_prop(
    session: Session,
    stat: str,
    player_id: str,
    raw_game_id: str,
    updated_value: float,
    league: Leagues,
    is_final: bool = False,
) -> None:
    """Update a given prop and its parlay_picks with current game data.

    First updates the actual prop in the database,
    then updates the status of the parlay_pick if the game is final,
    then finally sends a message to the server for the client to handle.

    Args:
        session: SQLAlchemy database session
        stat: The stat being updated
        player_id: ID of the player
        raw_game_id: ID of the game
        updated_value: New current value for the prop
        league: League type ("mlb" or "nba")
        is_final: Whether the game is final (default: False)
    """
    try:
        # Find and update the prop
        prop = session.execute(
            select(Props).where(
                Props.stat == stat,
                Props.raw_game_id == raw_game_id,
                Props.player_id == player_id,
                Props.league == league,
            )
        ).scalar_one_or_none()

        if prop is None:
            return

        prop.current_value = updated_value
        prop.resolved = is_final

        session.commit()

        publish_message("prop_updated", {"id": str(prop.id)})

        logger.info(f"✅ Updated {stat} for player {player_id}\n")

    except Exception as e:
        session.rollback()
        logger.fatal(f"⚠️ There was an error updating the prop: {e}")
        sys.exit(1)
