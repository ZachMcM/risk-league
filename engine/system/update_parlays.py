import asyncio
from shared.utils import setup_logger

from shared.db_session import get_db_session
from shared.redis_pubsub_utils import listen_for_messages
from shared.socket_utils import send_message as send_socket_message
from shared.tables import ParlayPicks
from sqlalchemy import select
from sqlalchemy.orm import Session
import math

logger = setup_logger(__name__)


def perfect_play_multiplier(n: int) -> float:
    """Gets the multiplier for a perfect play parlay given the number of picks
    Based on PrizePicks Power Play structure

    Args:
        n: The number of picks in the parlay
    """
    multipliers = {
        2: 3.0,   
        3: 5.0,    
        4: 10.0,   
        5: 20.0,   
        6: 37.5,   
    }
    
    return multipliers[n]


def flex_play_multiplier(n: int, hits: int) -> float:
    """Gets the multiplier for a flex play given the number of picks and number of hits
    Based on PrizePicks Flex Play structure

    Args:
        n: The number of the picks in the parlay
        hits: The number of hits in the parlay
    """
    if n < 2 or n > 10:
        raise ValueError("Number of picks must be between 2 and 10")
    
    if hits < 0 or hits > n:
        raise ValueError("Number of hits must be between 0 and number of picks")
    
    flex_payouts = {
        # 3-pick flex
        (3, 3): 2.25,
        (3, 2): 1.25, 
        
        # 4-pick flex  
        (4, 4): 5,
        (4, 3): 1.5,
        
        # 5-pick flex
        (5, 5): 10.0,
        (5, 4): 2.0,
        (5, 3): 0.4, 
        
        # 6-pick flex
        (6, 6): 25.0,
        (6, 5): 2.0, 
        (6, 4): 0.4, 
    }
    
    # Return exact payout if we have it
    if (n, hits) in flex_payouts:
        return flex_payouts[(n, hits)]
    
    return 0


def update_parlay(session: Session, pick_id: str):
    """Updates a parlay if all the picks are updated"""
    pick = session.execute(
        select(ParlayPicks).where(ParlayPicks.id == pick_id)
    ).scalar_one_or_none()
    if pick is None:
        return

    parlay = pick.parlay
    picks = parlay.parlay_picks

    for pick in picks:
        if pick.status == "not_resolved":
            return

    hit_count = 0
    for pick in picks:
        if pick.status == "hit":
            hit_count += 1
            
    if parlay.type == "perfect":
        if len(picks) != hit_count:
            payout = 0
        else:
            payout = perfect_play_multiplier(len(picks)) * parlay.stake
    else:
        multiplier = flex_play_multiplier(len(picks), hit_count)
        payout = multiplier * parlay.stake
        
    delta = payout - parlay.stake
    
    parlay.match_user.balance += payout
    parlay.resolved = True
    parlay.delta = delta

    session.commit()

    async def send_updates():
        await send_socket_message(
            namespace="/invalidation",
            message="data-invalidated",
            data=["parlays", parlay.match_user_id],
        )
        await send_socket_message(
            namespace="/invalidation",
            message="data-invalidated",
            data=["match", parlay.match_user.match_id],
        )
        user_ids = [user.id for user in parlay.match_user.match.match_users]
        await send_socket_message(
            namespace="/invalidation",
            message="data-invalidated",
            data=["matches", user_ids[0]],
        )
        await send_socket_message(
            namespace="/invalidation",
            message="data-invalidated",
            data=["matches", user_ids[1]],
        )

    asyncio.run(send_updates())


def listen_for_parlay_pick_updated():
    """Function that listens for a parlay_pick_updated message on redis"""
    session = get_db_session()

    def handle_pick_updated(data):
        """Handles incoming parlay_pick_updated messages"""
        pick_id = data.get("id")
        if not pick_id:
            logger.error("⚠️ Received parlay_pick_updated message without id")
            return

        update_parlay(session, pick_id)

    logger.info("🔄 Listening for parlay_pick_updated messages...")
    listen_for_messages("parlay_pick_updated", handle_pick_updated)


def main():
    """Main function that listens for parlay_pick_updated messages."""
    try:
        listen_for_parlay_pick_updated()
    except KeyboardInterrupt:
        logger.warning("🛑 Shutting down update_parlays...")
    except Exception as e:
        logger.error(f"⚠️ Error in main: {e}")


if __name__ == "__main__":
    main()
