import sys
from datetime import datetime

from shared.my_types import Leagues, Player
from shared.tables import (
    t_mlb_games,
    t_mlb_player_stats,
    t_nba_games,
    t_nba_player_stats,
    t_players,
    t_props,
    t_parlay_picks,
)
from shared.my_types import Prop
from shared.utils import db_response_to_json
from sqlalchemy import Engine, and_, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert


def get_player_last_games(
    engine: Engine, player_id: str, league: Leagues, n_games: int
):
    """Retrieve the last n games for a specific player.

    Args:
        engine: SQLAlchemy database engine
        player_id: ID of the player
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of player stats from the last n games
    """

    try:
        with engine.connect() as conn:
            if league == "mlb":
                j = t_mlb_player_stats.join(
                    t_mlb_games, t_mlb_player_stats.c.game_id == t_mlb_games.c.id
                )
                or_conditions = [
                    t_mlb_games.c.game_type == "R",
                    t_mlb_games.c.game_type == "P",
                ]
                where_clause = t_mlb_player_stats.c.player_id == player_id
                order_by = t_mlb_games.c.game_date.desc()
                table = t_mlb_player_stats
            elif league == "nba":
                j = t_nba_player_stats.join(
                    t_nba_games, t_nba_player_stats.c.game_id == t_nba_games.c.id
                )
                or_conditions = [
                    t_nba_games.c.game_type == "regular_season",
                    t_nba_games.c.game_type == "playoffs",
                ]
                where_clause = t_nba_player_stats.c.player_id == player_id
                order_by = t_nba_games.c.game_date.desc()
                table = t_nba_player_stats

            stmt = (
                select(table)
                .select_from(j)
                .where(or_(*or_conditions))
                .where(where_clause)
                .order_by(order_by)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            return last_games

    except Exception as e:
        print(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


def get_team_last_games(engine: Engine, team_id: str, league: Leagues, n_games: int):
    """Get the last n games for a team.

    Args:
        engine: SQLAlchemy database engine
        team_id: ID of the team
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of team game records from the last n games
    """
    if league == "mlb":
        or_conditions = [
            t_mlb_games.c.game_type == "R",
            t_mlb_games.c.game_type == "P",
        ]
        where_clause = t_mlb_games.c.team_id == str(team_id)
        order_by = t_mlb_games.c.game_date.desc()
        table = t_mlb_games
    elif league == "nba":
        or_conditions = [
            t_nba_games.c.game_type == "regular_season",
            t_nba_games.c.game_type == "playoffs",
        ]
        where_clause = t_nba_games.c.team_id == str(team_id)
        order_by = t_nba_games.c.game_date.desc()
        table = t_nba_games

    try:
        with engine.connect() as conn:
            stmt = (
                select(table)
                .where(where_clause)
                .where(or_(*or_conditions))
                .order_by(order_by)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)
            return last_games
    except Exception as e:
        print(f"⚠️  There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)


def get_opposing_team_last_games(
    engine: Engine, id_list: list[str], league: Leagues, n_games: int
):
    """Get opposing team games from a list of game IDs.

    Args:
        engine: SQLAlchemy database engine
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
                    t_nba_games.c.id.startswith(game_prefix),
                    t_nba_games.c.id != game_id,
                )
            )
        elif league == "mlb":
            raw_game_id, _ = game_id.split("_")
            game_prefix = f"{raw_game_id}_"

            conditions.append(
                and_(
                    t_mlb_games.c.id.startswith(game_prefix),
                    t_mlb_games.c.id != game_id,
                )
            )

    if league == "mlb":
        or_conditions = [
            t_mlb_games.c.game_type == "R",
            t_mlb_games.c.game_type == "P",
        ]
        order_by = t_mlb_games.c.game_date.desc()
        table = t_mlb_games
    elif league == "nba":
        or_conditions = [
            t_nba_games.c.game_type == "regular_season",
            t_nba_games.c.game_type == "playoffs",
        ]
        order_by = t_nba_games.c.game_date.desc()
        table = t_nba_games

    try:
        with engine.connect() as conn:
            stmt = (
                select(table)
                .where(or_(*conditions))
                .where(or_(*or_conditions))
                .order_by(order_by)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching opposing team games {e}")
        sys.exit(1)


def get_players_from_team(engine: Engine, team_id: str) -> list[Player]:
    """Get a list of all players from a team.

    Args:
        engine: SQLAlchemy database engine
        team_id: ID of the team

    Returns:
        List of Player objects from the team
    """
    try:
        with engine.connect() as conn:
            stmt = select(t_players).where(
                t_players.c.team_id == str(team_id),
            )
            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ Error fetching roster for team {team_id}: {e}")
        sys.exit(1)


def get_games_by_id(engine: Engine, id_list: list[str], league: Leagues, n_games: int):
    """Retrieve games by their IDs.

    Args:
        engine: SQLAlchemy database engine
        id_list: List of game IDs
        league: League type ("mlb" or "nba")
        n_games: Number of games to retrieve

    Returns:
        List of game records matching the provided IDs
    """
    if league == "nba":
        table = t_nba_games
        where_clause = t_nba_games.c.id.in_(id_list)
        or_conditions = [
            t_nba_games.c.game_type == "regular_season",
            t_nba_games.c.game_type == "playoffs",
        ]
        order_by = t_nba_games.c.game_date.desc()
    elif league == "mlb":
        table = t_mlb_games
        where_clause = t_mlb_games.c.id.in_(id_list)
        or_conditions = [t_mlb_games.c.game_type == "P", t_mlb_games.c.game_type == "R"]
        order_by = t_mlb_games.c.game_date.desc()

    try:
        with engine.connect() as conn:
            stmt = (
                select(table)
                .where(where_clause)
                .where(or_(*or_conditions))
                .order_by(order_by)
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching games by id, {e}")
        sys.exit(1)


def insert_prop(
    engine: Engine,
    line: float,
    game_id: str,
    player_id: str,
    stat: str,
    game_start_time: datetime,
    league: Leagues,
    pick_options=["over", "under"],
):
    """Insert a prop into the database.

    Args:
        engine: SQLAlchemy database engine
        line: The prop line/threshold value
        game_id: ID of the game
        player_id: ID of the player
        stat: The stat being predicted
        game_start_time: When the game starts
        league: League type ("mlb" or "nba")
        pick_options: Available pick options (default: ["over", "under"])
    """
    try:
        with engine.begin() as conn:
            stmt = pg_insert(t_props).values(
                line=line,
                raw_game_id=game_id,
                player_id=player_id,
                stat=stat,
                game_start_time=game_start_time,
                league=league,
                pick_options=pick_options,
            )

            update_cols = {
                col: stmt.excluded[col]
                for col in [
                    "line",
                    "raw_game_id",
                    "player_id",
                    "stat",
                    "game_start_time",
                    "league",
                ]
            }

            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            conn.execute(stmt)
    except Exception as e:
        print(f"⚠️ There was an error inserting the prop, {e}")
        sys.exit(1)


def update_prop(
    engine: Engine,
    stat: str,
    player_id: str,
    raw_game_id: str,
    updated_value,
    league: Leagues,
    is_final=False,
):
    """Update a given prop with current game data.

    Args:
        engine: SQLAlchemy database engine
        stat: The stat being updated
        player_id: ID of the player
        raw_game_id: ID of the game
        updated_value: New current value for the prop
        league: League type ("mlb" or "nba")
        is_final: Whether the game is final (default: False)
    """
    try:
        with engine.begin() as conn:
            stmt = (
                update(t_props)
                .where(t_props.c.stat == stat)
                .where(t_props.c.raw_game_id == raw_game_id)
                .where(t_props.c.player_id == player_id)
                .where(t_props.c.league == league)
                .values(current_value=updated_value, resolved=is_final)
            )

            result = conn.execute(stmt)
            if result.rowcount != 0:
                print(f"✅ Updated {stat} for player {player_id}\n")
    except Exception as e:
        print(f"⚠️ There was an error updating the prop: {e}")
        sys.exit(1)


def get_props_by_game(engine: Engine, raw_game_id: str) -> list[Prop]:
    """Get all props for a specific game.

    Args:
        engine: SQLAlchemy database engine
        raw_game_id: ID of the game

    Returns:
        List of Prop objects for the game
    """
    try:
        with engine.connect() as conn:
            stmt = select(t_props).where(t_props.raw_game_id == raw_game_id)

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)

    except Exception as e:
        print(f"🚨 There was an error updating the parlay picks")
        sys.exit(1)


def update_parlay_picks(engine: Engine, raw_game_id: str):
    """Updates a all parlays for a prop based on a raw_game_id

    Args:
        engine: SQLAlchemy database engine
        raw_game_id: ID of the game
    """

    props: list[Prop] = get_props_by_game(engine, raw_game_id)
    try:
        with engine.begin() as conn:
            for prop in props:
                prop_final_status = (
                    "over" if prop["current_value"] > prop["line"] else "under"
                )
                
                # Update picks that match the winning outcome to "hit"
                hit_stmt = (
                    update(t_parlay_picks)
                    .where(t_parlay_picks.c.prop_id == prop["id"])
                    .where(t_parlay_picks.c.pick == prop_final_status)
                    .values(status="hit")
                )
                
                # Update picks that don't match the winning outcome to "missed"
                missed_stmt = (
                    update(t_parlay_picks)
                    .where(t_parlay_picks.c.prop_id == prop["id"])
                    .where(t_parlay_picks.c.pick != prop_final_status)
                    .values(status="missed")
                )

                conn.execute(hit_stmt)
                conn.execute(missed_stmt)
    except Exception as e:
        print(f"⚠️ There was an error updating the parlay picks: {e}")
        sys.exit(1)
