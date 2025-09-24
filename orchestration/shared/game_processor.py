import logging

from db.games import Game, insert_game
from db.stats.baseball import insert_baseball_player_stats, insert_baseball_team_stats
from db.stats.basketball import (
    insert_basketball_player_stats,
    insert_basketball_team_stats,
)
from db.stats.football import insert_football_player_stats, insert_football_team_stats
from extract_stats.main import LEAGUE_CONFIG, extract_player_stats, extract_team_stats

logger = logging.getLogger(__name__)

# Mapping of sports to their respective database insertion functions
SPORT_DB_FUNCTIONS = {
    "baseball": {
        "team_insert": insert_baseball_team_stats,
        "player_insert": insert_baseball_player_stats,
    },
    "football": {
        "team_insert": insert_football_team_stats,
        "player_insert": insert_football_player_stats,
    },
    "basketball": {
        "team_insert": insert_basketball_team_stats,
        "player_insert": insert_basketball_player_stats,
    },
}


def process_game(game, league):
    """Process a single game for the given league."""

    # Insert game data
    game_data: Game = {
        "game_id": game["game_ID"],
        "league": league,
        "home_team_id": game["full_box"]["home_team"]["team_id"],
        "away_team_id": game["full_box"]["away_team"]["team_id"],
        "start_time": game["game_time"],
    }
    insert_game(game_data)

    logger.info(f"Successfully inserted game {game['game_ID']}")

    # Extract team stats
    team_stats_list = []
    for team in ["home_team", "away_team"]:
        team_stats = game["full_box"][team].get("team_stats", {})
        if team_stats:
            team_stats_list.append(extract_team_stats(game, team, league))

    # Extract player stats
    player_stats_list, total_player_stats = extract_player_stats(game, league)

    # Get the sport and corresponding database functions
    config = LEAGUE_CONFIG[league]
    sport = config["sport"]
    db_functions = SPORT_DB_FUNCTIONS[sport]

    # Insert team stats directly into database
    team_stats_inserted = 0
    if team_stats_list:
        try:
            team_stats_result = db_functions["team_insert"](team_stats_list)
            team_stats_inserted = len(team_stats_result)
            logger.info(
                f"Successfully inserted {team_stats_inserted} team stat entries"
            )
        except Exception as e:
            logger.error(f"Error inserting team stats for game {game['game_ID']}: {e}")
            raise

    # Insert player stats directly into database
    player_stats_inserted = 0
    if player_stats_list:
        try:
            player_stats_result = db_functions["player_insert"](player_stats_list)
            player_stats_inserted = len(player_stats_result)
            logger.info(
                f"Successfully inserted {player_stats_inserted}/{total_player_stats} player stat entries"
            )
        except Exception as e:
            logger.error(
                f"Error inserting player stats for game {game['game_ID']}: {e}"
            )
            raise

    logger.info(
        f"Successfully processed game {game['game_ID']}: {team_stats_inserted} team stats, {player_stats_inserted}/{total_player_stats} player stats"
    )

    return team_stats_inserted, player_stats_inserted
