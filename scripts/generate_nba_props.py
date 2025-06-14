import os
import sys
from datetime import datetime
from time import time
import requests
import numpy as np
from constants import minutes_threshold, n_games
from dotenv import load_dotenv
from my_types import NbaGame, NbaPlayer, NbaPlayerStats, PlayerData
from nba_eligibility import is_combined_stat_prop_eligible, is_prop_eligible
from sqlalchemy import create_engine, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from tables import nba_games, nba_player_stats, nba_players, nba_props
from utils import db_response_to_json

from nba_regression import (
    generate_ast_prop,
    generate_blk_prop,
    generate_pts_prop,
    generate_reb_prop,
    generate_stl_prop,
    generate_three_pm_prop,
    generate_tov_prop,
    round_prop,
)

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


# gets all the games for today
def get_today_games(test_date=None):
    url = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json"
    res = requests.get(url)
    data = res.json()

    today_str = datetime.today().strftime("%m/%d/%Y 00:00:00")

    if test_date != None:
        today_str = test_date

    for date in data["leagueSchedule"]["gameDates"]:
        if date["gameDate"] == today_str:
            return date["games"]

    return []


# get a list of all the player_ids from a team
def get_players_from_team(team_id: str) -> list[NbaPlayer]:
    try:
        with engine.connect() as conn:
            stmt = select(nba_players).where(
                nba_players.c.team_id == str(team_id),
            )
            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ Error fetching roster for team {team_id}: {e}")
        sys.exit(1)


def get_games_by_id(id_list: list[str], regular_season_only=True) -> list[NbaGame]:
    try:
        with engine.connect() as conn:
            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_games)
                .where(nba_games.c.id.in_(id_list))
                .where(or_(*conditions))
                .order_by(nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            return db_response_to_json(result)
    except Exception as e:
        print(f"⚠️ There was an error fetching games by id, {e}")
        sys.exit(1)


# gets the last n_games games for a team
def get_team_last_games(
    team_id: str, regular_season_only=True
) -> list[NbaGame] | list[str]:
    try:
        with engine.connect() as conn:
            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_games)
                .where(nba_games.c.team_id == str(team_id))
                .where(or_(*conditions))
                .order_by(nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)
            return last_games
    except Exception as e:
        print(f"⚠️  There was an error fetching the last games for team {team_id}, {e}")
        sys.exit(1)


# returns a players last n_games games if they are eligible for a prop
def get_player_last_games(
    player_id, regular_season_only=True
) -> list[NbaPlayerStats] | None:
    try:
        with engine.connect() as conn:
            j = nba_player_stats.join(
                nba_games, nba_player_stats.c.game_id == nba_games.c.id
            )

            conditions = [nba_games.c.game_type == "regular_season"]

            if not regular_season_only:
                conditions.append(nba_games.c.game_type == "playoffs")

            stmt = (
                select(nba_player_stats)
                .select_from(j)
                .where(or_(*conditions))
                .where(nba_player_stats.c.player_id == str(player_id))
                .order_by(nba_games.c.game_date.desc())
                .limit(n_games)
            )

            result = conn.execute(stmt).fetchall()
            last_games = db_response_to_json(result)

            # if no games were found or
            # the player didn't play enough out of the teams last n games
            # or the player doesn't average enough minutes we return null to skip this player

            avg_minutes = (
                0
                if len(last_games) == 0
                else sum(game["min"] for game in last_games) / len(last_games)
            )

            if len(last_games) != n_games or avg_minutes < minutes_threshold:
                print(f"🚨 Skipping player {player_id}\n")
                return None
            else:
                return last_games

    except Exception as e:
        print(f"⚠️ Error fetching eligible players: {e}")
        sys.exit(1)


# inserts a prop into the database
def insert_prop(
    line: float, game_id: str, player_id: str, stat_type: str, game_start_time: datetime
):
    try:
        with engine.begin() as conn:
            stmt = pg_insert(nba_props).values(
                line=line,
                raw_game_id=game_id,
                player_id=player_id,
                stat_type=stat_type,
                game_start_time=game_start_time,
                current_value=0,
            )

            update_cols = {
                col: stmt.excluded[col]
                for col in [
                    "line",
                    "raw_game_id",
                    "player_id",
                    "stat_type",
                    "game_start_time",
                    "current_value",
                ]
            }

            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            conn.execute(stmt)
    except Exception as e:
        print(f"⚠️ There was an error inserting the prop, {e}")
        sys.exit(1)


def main():
    # start timing the execution
    start = time()

    test_date = None
    if len(sys.argv) == 2:
        test_date = sys.argv[1]

    # we are gonna have a data structure with player and basic game data for future lookups
    print("Currently getting today's games")

    todays_games = get_today_games(test_date)

    print("Finished getting today's games ✅\n")

    player_data_list: list[PlayerData] = []
    team_games_cache: dict[str, list[NbaGame]] = {}

    total_props_generated = 0

    for i, today_game in enumerate(todays_games):
        print(
            f"Getting initial game data for game {today_game['gameId']} {i + 1}/{len(todays_games)}\n"
        )
        home_team_id = today_game["homeTeam"]["teamId"]
        away_team_id = today_game["awayTeam"]["teamId"]

        home_team_players = get_players_from_team(home_team_id)
        away_team_players = get_players_from_team(away_team_id)
        all_game_players = home_team_players + away_team_players

        for player in all_game_players:
            player_last_games = get_player_last_games(player["id"])

            if player_last_games == None:
                continue

            matchup = ""
            if player["team_id"] == home_team_id:
                matchup = away_team_id
            else:
                matchup = home_team_id

            player_data_list.append(
                {
                    "matchup": matchup,
                    "player": player,
                    "game_id": today_game["gameId"],
                    "last_games": player_last_games,
                    "game_start_time": today_game["gameDateTimeUTC"],
                }
            )

    # we now have our whole list of players who at a baseline are eligible for prop ceration
    for player_data in player_data_list:
        player = player_data["player"]
        print(
            f"Processing player {player['name']} {player['id']} against team {player_data['matchup']}\n"
        )

        # first we get all the mu's we need

        mu_pts = np.mean([game["pts"] for game in player_data["last_games"]])
        mu_reb = np.mean([game["reb"] for game in player_data["last_games"]])
        mu_ast = np.mean([game["ast"] for game in player_data["last_games"]])
        mu_three_pm = np.mean([game["three_pm"] for game in player_data["last_games"]])
        mu_blk = np.mean([game["blk"] for game in player_data["last_games"]])
        mu_stl = np.mean([game["stl"] for game in player_data["last_games"]])
        mu_tov = np.mean([game["tov"] for game in player_data["last_games"]])
        mu_pra = np.mean(
            [
                game["pts"] + game["ast"] + game["reb"]
                for game in player_data["last_games"]
            ]
        )
        mu_reb_ast = np.mean(
            [game["reb"] + game["ast"] for game in player_data["last_games"]]
        )
        mu_pts_ast = np.mean(
            [game["pts"] + game["ast"] for game in player_data["last_games"]]
        )

        # then we get the booleans for eligiblity

        pts_prop_eligible = is_prop_eligible(engine, "pts", mu_pts, player["position"])
        reb_prop_eligible = is_prop_eligible(engine, "reb", mu_reb, player["position"])
        ast_prop_eligible = is_prop_eligible(engine, "ast", mu_ast, player["position"])
        three_pm_prop_eligible = is_prop_eligible(
            engine, "three_pm", mu_three_pm, player["position"]
        )
        blk_prop_eligible = is_prop_eligible(engine, "blk", mu_blk, player["position"])
        stl_prop_eligible = is_prop_eligible(engine, "stl", mu_stl, player["position"])
        tov_prop_eligible = is_prop_eligible(engine, "tov", mu_tov, player["position"])
        pra_prop_eligible = is_combined_stat_prop_eligible(
            engine, "pra", mu_pra, player["position"]
        )
        reb_ast_prop_eligible = is_combined_stat_prop_eligible(
            engine, "reb_ast", mu_reb_ast, player["position"]
        )
        pts_ast_prop_eligible = is_combined_stat_prop_eligible(
            engine, "pts_ast", mu_pts_ast, player["position"]
        )

        # we just continue and don't do anymore intensive processing if no props are needed to be created
        if not any(
            [
                pts_prop_eligible,
                reb_prop_eligible,
                ast_prop_eligible,
                three_pm_prop_eligible,
                blk_prop_eligible,
                stl_prop_eligible,
                tov_prop_eligible,
                pra_prop_eligible,
                reb_ast_prop_eligible,
                pts_ast_prop_eligible,
            ]
        ):
            continue

        # we get the last n games for the opposing team
        if player_data["matchup"] not in team_games_cache:
            team_games_cache[player_data["matchup"]] = get_team_last_games(
                player_data["matchup"]
            )
        matchup_last_games = team_games_cache[player_data["matchup"]]

        # we get full team stats for the player's last n games
        # we use the get games by id function to make sure we aren't getting games the player didn't play in

        team_last_games = get_games_by_id(
            [game["game_id"] for game in player_data["last_games"]]
        )

        # check for prop eligibility and if so insert

        if pts_ast_prop_eligible:
            pts_line = generate_pts_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                pts_line,
                player_data["game_id"],
                player["id"],
                "pts",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if reb_prop_eligible:
            reb_line = generate_reb_prop(player_data["last_games"], matchup_last_games)
            insert_prop(
                reb_line,
                player_data["game_id"],
                player["id"],
                "reb",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if ast_prop_eligible:
            ast_line = generate_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                ast_line,
                player_data["game_id"],
                player["id"],
                "ast",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if three_pm_prop_eligible:
            three_pm_line = generate_three_pm_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                three_pm_line,
                player_data["game_id"],
                player["id"],
                "three_pm",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if blk_prop_eligible:
            blk_line = generate_blk_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                blk_line,
                player_data["game_id"],
                player["id"],
                "blk",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if stl_prop_eligible:
            stl_line = generate_stl_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                stl_line,
                player_data["game_id"],
                player["id"],
                "stl",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if tov_prop_eligible:
            tov_line = generate_tov_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            insert_prop(
                tov_line,
                player_data["game_id"],
                player["id"],
                "tov",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if pra_prop_eligible:
            pts_line = generate_pts_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            reb_line = generate_reb_prop(player_data["last_games"], matchup_last_games)
            ast_line = generate_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            pra_line = round_prop(pts_line + reb_line + ast_line)
            insert_prop(
                pra_line,
                player_data["game_id"],
                player["id"],
                "pra",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if pts_ast_prop_eligible:
            pts_line = generate_pts_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            ast_line = generate_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            pts_ast_line = round_prop(pts_line + ast_line)
            insert_prop(
                pts_ast_line,
                player_data["game_id"],
                player["id"],
                "pts_ast",
                player_data["game_start_time"],
            )
            total_props_generated += 1

        if reb_ast_prop_eligible:
            reb_line = generate_reb_prop(player_data["last_games"], matchup_last_games)
            ast_line = generate_ast_prop(
                player_data["last_games"], matchup_last_games, team_last_games
            )
            reb_ast_line = round_prop(reb_line + ast_line)
            insert_prop(
                reb_ast_line,
                player_data["game_id"],
                player["id"],
                "reb_ast",
                player_data["game_start_time"],
            )
            total_props_generated += 1

    end = time()
    print(
        f"✅ Script finished executing in {end - start:.2f} seconds. A total of {total_props_generated} props were generated"
    )

    engine.dispose()


if __name__ == "__main__":
    main()
