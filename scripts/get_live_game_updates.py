import os
from nba_api.live.nba.endpoints import BoxScore
from dotenv import load_dotenv
from sqlalchemy import create_engine, update
from tables import nba_props
from utils import (
    get_today_games,
)
from my_types import StatType, stat_name_list

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

# gets all the player stats for a given live game
def get_player_stats(game_id: str):
    boxscore = BoxScore(game_id).game.get_dict()
    home_players = boxscore["homeTeam"]["players"]
    away_players = boxscore["awayTeam"]["players"]
    return home_players + away_players

# updates a given prop
def update_prop(stat_type: StatType, player_id: str, raw_game_id: str, updated_value):
    try:
        with engine.begin() as conn:
            stmt = (
                update(nba_props)
                .where(nba_props.c.stat_type == stat_type)
                .where(nba_props.c.raw_game_id == raw_game_id)
                .where(nba_props.c.player_id == player_id)
                .values(current_value=updated_value)
            )

            result = conn.execute(stmt)
            if result.rowcount != 0:
                print(f"✅ Updated {stat_type} for player {player_id}\n")
    except Exception as e:
        print(f"⚠️ There was an error updating the prop: {e}")


def main():
    total_updated = 0
    games = get_today_games(test_games=True)

    for i, game in enumerate(games):
        print(f"Processing game {i + 1}/{len(games)}\n")
        player_stats = get_player_stats(game["gameId"])

        for j, player in enumerate(player_stats):
            print(f"Processing player {player['name']} {j + 1}/{len(player_stats)}\n")
            stats = player["statistics"]

            # loop through all the non combined stats
            for stat_name in stat_name_list:
                update_prop(
                    stat_name["db_name"],
                    str(player["personId"]),
                    str(game["gameId"]),
                    stats[stat_name["api_name"]],
                )
                total_updated += 1

            pra = stats["points"] + stats["reboundsTotal"] + stats["assists"]
            update_prop("pra", str(player["personId"]), str(game["gameId"]), pra)
            total_updated += 1

            pts_ast = stats["points"] + stats["assists"]
            update_prop(
                "pts_ast", str(player["personId"]), str(game["gameId"]), pts_ast
            )
            total_updated += 1

            reb_ast = stats["reboundsTotal"] + stats["assists"]
            update_prop(
                "reb_ast", str(player["personId"]), str(game["gameId"]), reb_ast
            )
            total_updated += 1

    print(f"✅ Successfully updated {total_updated} props\n")
    engine.dispose()


if __name__ == "__main__":
    main()
