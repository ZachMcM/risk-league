from shared.utils import setup_logger
import signal
import sys
import asyncio

from apscheduler.schedulers.background import BackgroundScheduler
from shared.db_session import get_db_session
from shared.date_utils import get_today_eastern
from shared.get_today_games import get_today_mlb_games, get_today_nba_games
from shared.tables import Matches
from sqlalchemy import select, func, or_
from system.constants import K, MIN_BETS_REQ
from shared.socket_utils import send_message as send_socket_message


logger = setup_logger(__name__)


def recalculate_elo(current_elos: list[int], winner: int | None) -> list[int]:
    """Recalculates each users elo based on the winner of a match

    The formula is based on the official formula created by Arpad Elo.
    https://en.wikipedia.org/wiki/Elo_rating_system
    """
    R_A = current_elos[0]
    R_B = current_elos[1]

    # Handle ties (winner = None)
    if winner is None:
        S_A = 0.5
        S_B = 0.5
    else:
        S_A = 1 if winner == 0 else 0
        S_B = 1 - S_A

    # probability of player one winning
    E_A = 1 / (1 + pow(10, (R_A - R_B) / 400))

    # probability of player two winning
    E_B = 1 - E_A

    R_prime_A = R_A + K * (S_A - E_A)
    R_prime_B = R_B + K * (S_B - E_B)

    return [R_prime_A, R_prime_B]


def update_matches():
    session = get_db_session()
    """Updates all the matches if all today's games are finished.
    
    Function checks if all the games for each sport today are finalized. 
    If not return out. If so we find every match created today and updates it.
    """
    mlb_games = get_today_mlb_games()
    nba_games = get_today_nba_games()

    all_mlb_games_final = True if len(mlb_games) > 0 else None
    all_nba_games_final = True if len(nba_games) > 0 else None

    for game in nba_games:
        if game["gameStatusText"] != "Final":
            all_nba_games_final = False

    for game in mlb_games:
        status = game.get("status")
        if status != "Final":
            all_mlb_games_final = False

    or_conditions = []
    if all_mlb_games_final:
        or_conditions.append(Matches.game_mode == "mlb")

    if all_nba_games_final:
        or_conditions.append(Matches.game_mode == "nba")
        
    if not or_conditions:
        logger.info("No games to end")
        return

    matches = (
        session.execute(
            select(Matches)
            .where(func.date(Matches.created_at) == get_today_eastern())
            .where(or_(*or_conditions))
            .where(~Matches.resolved)
        )
        .scalars()
        .all()
    )

    for match in matches:
        match_users = match.match_users
        user1 = match_users[0]
        user2 = match_users[1]

        # Check for disqualifications based on minimum betting activity
        user1_total_bets = len(user1.parlays)
        user2_total_bets = len(user2.parlays)

        winner = None

        # Handle disqualifications first
        if user1_total_bets < MIN_BETS_REQ and user2_total_bets >= MIN_BETS_REQ:
            user1.status = "disqualified"
            user2.status = "win"
            winner = 1
        elif user2_total_bets < MIN_BETS_REQ and user1_total_bets >= MIN_BETS_REQ:
            user2.status = "disqualified"
            user1.status = "win"
            winner = 0
        elif user1_total_bets < MIN_BETS_REQ and user2_total_bets < MIN_BETS_REQ:
            user1.status = "disqualified"
            user2.status = "disqualified"
            winner = None
        # Handle normal competition
        elif user1.balance > user2.balance:
            user1.status = "win"
            user2.status = "loss"
            winner = 0
        elif user1.balance == user2.balance:
            user1.status = "draw"
            user2.status = "draw"
            winner = None
        else:
            user1.status = "win"
            user2.status = "loss"
            winner = 1

        # Calculate ELO changes (only if both users aren't disqualified)
        if not (user1.status == "disqualified" and user2.status == "disqualified"):
            new_elos = recalculate_elo(
                [user1.user.elo_rating, user2.user.elo_rating], winner
            )

            user1.elo_delta = new_elos[0] - user1.user.elo_rating
            user2.elo_delta = new_elos[1] - user2.user.elo_rating

            user1.user.elo_rating = new_elos[0]
            user2.user.elo_rating = new_elos[1]
        else:
            # No ELO changes for double disqualification
            user1.elo_delta = 0
            user2.elo_delta = 0

        match.resolved = True
        session.commit()

        async def send_updates():
            # invalidate the match
            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=["match", match.id],
            )

            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=["matches", user1.user_id],
            )

            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=["matches", user2.user_id],
            )

            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=["user", user1.user_id],
            )
            await send_socket_message(
                namespace="/invalidation",
                message="data-invalidated",
                data=["user", user2.user_id],
            )

        asyncio.run(send_updates())


def main():
    """Main function that runs the NBA props sync scheduler.

    Starts a background scheduler that syncs props every 60 seconds.
    """
    update_matches()
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_matches, "interval", seconds=60)
    scheduler.start()

    try:
        signal.pause()
    except (KeyboardInterrupt, SystemExit):
        logger.warning("Exiting...")
        scheduler.shutdown()
    except Exception as e:
        logger.fatal(f"Unhandled exception: {e}")
        scheduler.shutdown()
        sys.exit(1)


if __name__ == "__main__":
    main()
