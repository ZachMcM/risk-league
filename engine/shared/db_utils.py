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
)
from shared.utils import db_response_to_json
from sqlalchemy import Engine, and_, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert


def get_player_last_games(
    engine: Engine, player_id: str, league: Leagues, n_games: int
):

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


# gets the last n_games games for a team
def get_team_last_games(engine: Engine, team_id: str, league: Leagues, n_games: int):
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


# get a list of all the player_ids from a team
def get_players_from_team(engine: Engine, team_id: str) -> list[Player]:
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


# inserts a prop into the database
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


# updates a given prop
def update_prop(
    engine: Engine, stat: str, player_id: str, raw_game_id: str, updated_value, league: Leagues
):
    try:
        with engine.begin() as conn:
            stmt = (
                update(t_props)
                .where(t_props.c.stat == stat)
                .where(t_props.c.raw_game_id == raw_game_id)
                .where(t_props.c.player_id == player_id)
                .where(t_props.c.league == league)
                .values(current_value=updated_value)
            )

            result = conn.execute(stmt)
            if result.rowcount != 0:
                print(f"✅ Updated {stat} for player {player_id}\n")
    except Exception as e:
        print(f"⚠️ There was an error updating the prop: {e}")
