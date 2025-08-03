from shared.utils import setup_logger
import signal
import sys
import asyncio

from apscheduler.schedulers.background import BackgroundScheduler
from shared.db_session import get_db_session
from shared.tables import Matches
from sqlalchemy import select
from system.constants import K, MIN_BETS_REQ
from shared.socket_utils import send_message as send_socket_message


logger = setup_logger(__name__)


def recalculate_elo(current_elos: list[float], winner: int | None) -> list[int]:
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
    E_A = 1 / (1 + pow(10, (R_B - R_A) / 400))

    # probability of player two winning
    E_B = 1 - E_A

    R_prime_A = R_A + K * (S_A - E_A)
    R_prime_B = R_B + K * (S_B - E_B)

    return [round(R_prime_A), round(R_prime_B)]


def update_matches():
    """Updates all the matches if all today's games are finished.

    Function checks if all the games for each sport today are finalized.
    If not return out. If so we find every match created today and updates it.
    """
    session = get_db_session()

    logger.info("Finding matches to update")

    matchesToUpdate: list[Matches] = []
    unResolvedMatches = (
        session.execute(select(Matches).where(~Matches.resolved)).scalars().all()
    )

    # TODO this logic needs to be fixed at somepoint
    for match in unResolvedMatches:
        all_parays_resolved = True
        for user in match.match_users:
            if len(user.parlays) == 0:
                all_parays_resolved = False
            for parlay in user.parlays:
                if not parlay.resolved:
                    all_parays_resolved = False

        if all_parays_resolved:
            matchesToUpdate.append(match)

    logger.info(f"{len(matchesToUpdate)} Matches to update")

    for match in matchesToUpdate:
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
            
        session.commit()
        
        if match.type == "competitive":
            # Calculate ELO changes (only if both users aren't disqualified)
            if not (user1.status == "disqualified" and user2.status == "disqualified"):
                if user1.user is None or user2.user is None:
                    return
                
                new_elos = recalculate_elo(
                    [user1.user.elo_rating, user2.user.elo_rating], winner
                )

                user1.elo_delta = max(0, new_elos[0] - user1.user.elo_rating)
                user2.elo_delta = max(0, new_elos[1] - user2.user.elo_rating)

                user1.user.elo_rating = max(1200, new_elos[0])
                user2.user.elo_rating = max(1200, new_elos[1])
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
