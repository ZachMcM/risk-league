from utils import setup_logger
import asyncio
from typing import TypedDict, Optional, Dict, List
from redis_utils import (
    create_async_redis_client,
    listen_for_messages_async,
    publish_message_async,
)
from db.connection import get_async_pool
from time import time

logger = setup_logger(__name__)

# Semaphore to limit concurrent handlers and prevent connection pool exhaustion
_semaphore = asyncio.Semaphore(15)


class PickResult(TypedDict):
    id: int
    status: str
    parlay_id: int


class MatchUserResult(TypedDict):
    balance: float
    match_id: int
    user_id: str


class DynastyLeagueUserResult(TypedDict):
    balance: float
    dynasty_league_id: int
    user_id: str


class ParlayResult(TypedDict):
    id: int
    stake: float
    type: str
    resolved: bool
    match_user_id: Optional[int]
    dynasty_league_user_id: Optional[int]
    picks: List[PickResult]
    match_user: Optional[MatchUserResult]
    dynasty_league_user: Optional[DynastyLeagueUserResult]


def get_perfect_play_multiplier(pick_count: int) -> float:
    """Gets the multiplier for a perfect play parlay given the number of picks"""
    if pick_count < 2:
        return 1

    multipliers: Dict[int, float] = {
        2: 3.0,
        3: 5.0,
        4: 10.0,
        5: 20.0,
        6: 37.5,
    }
    return multipliers.get(pick_count, 0.0)


def get_flex_multiplier(pick_count: int, hit_count: int) -> float:
    """Gets the multiplier for a flex play given the number of picks and hits"""
    if pick_count < 3:
        return 1

    flex_payouts: Dict[str, float] = {
        # 3-pick flex
        "3-3": 2.25,
        "3-2": 1.25,
        # 4-pick flex
        "4-4": 5.0,
        "4-3": 1.5,
        # 5-pick flex
        "5-5": 10.0,
        "5-4": 2.0,
        "5-3": 0.4,
        # 6-pick flex
        "6-6": 25.0,
        "6-5": 2.0,
        "6-4": 0.4,
    }
    key = f"{pick_count}-{hit_count}"
    return flex_payouts.get(key, 0.0)


async def handle_pick_resolved(data):
    """Handles incoming pick_resolved messages asynchronously"""
    start_time = time()
    pick_id = data.get("id")
    if not pick_id:
        logger.error("Received pick_resolved message without id")
        return

    redis_publisher = await create_async_redis_client()

    try:
        pool = await get_async_pool()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute("BEGIN")

                    # Verify pick exists
                    pick_check_query = """
                        SELECT id
                        FROM pick
                        WHERE id = %s
                    """

                    await cur.execute(pick_check_query, (pick_id,))
                    pick_res = await cur.fetchone()

                    if not pick_res:
                        logger.warning(f"No pick found with id {pick_id}")
                        await cur.execute("ROLLBACK")
                        return

                    # Get parlay with all picks and user information
                    parlay_query = """
                        SELECT
                            p.id as parlay_id,
                            p.stake,
                            p.type,
                            p.resolved,
                            p.match_user_id,
                            p.dynasty_league_user_id,
                            mu.balance as match_user_balance,
                            mu.match_id,
                            mu.user_id as match_user_user_id,
                            dlu.balance as dynasty_league_user_balance,
                            dlu.dynasty_league_id,
                            dlu.user_id as dynasty_league_user_user_id
                        FROM pick pk
                        JOIN parlay p ON pk.parlay_id = p.id
                        LEFT JOIN match_user mu ON p.match_user_id = mu.id
                        LEFT JOIN dynasty_league_user dlu ON p.dynasty_league_user_id = dlu.id
                        WHERE pk.id = %s
                    """

                    await cur.execute(parlay_query, (pick_id,))
                    parlay_res = await cur.fetchone()

                    if not parlay_res:
                        logger.error(f"No parlay found containing pick {pick_id}")
                        await cur.execute("ROLLBACK")
                        return

                    # Lock the parlay row to prevent concurrent processing
                    lock_parlay_query = """
                        SELECT id, resolved
                        FROM parlay
                        WHERE id = %s
                        FOR UPDATE
                    """

                    await cur.execute(lock_parlay_query, (parlay_res[0],))
                    locked_parlay = await cur.fetchone()

                    # Check if parlay is already resolved after acquiring lock
                    if locked_parlay and locked_parlay[1]:  # resolved column
                        await cur.execute("COMMIT")
                        return

                    # Get all picks for this parlay
                    picks_query = """
                        SELECT id, status
                        FROM pick
                        WHERE parlay_id = %s
                    """

                    await cur.execute(picks_query, (parlay_res[0],))
                    picks_res = await cur.fetchall()

                    # Check if any picks are still not resolved
                    hit_count = 0
                    ignore_pick_count = 0

                    for pick_row in picks_res:
                        pick_status = pick_row[1]
                        if pick_status == "not_resolved":
                            # Parlay not ready to be resolved yet
                            await cur.execute("COMMIT")
                            return
                        elif pick_status == "hit":
                            hit_count += 1
                        elif pick_status in ["tie", "did_not_play"]:
                            ignore_pick_count += 1

                    # Calculate payout
                    effective_pick_count = len(picks_res) - ignore_pick_count
                    parlay_type = parlay_res[2]
                    stake = float(parlay_res[1])

                    if parlay_type == "perfect":
                        if effective_pick_count != hit_count:
                            payout = 0.0
                        else:
                            payout = (
                                get_perfect_play_multiplier(effective_pick_count)
                                * stake
                            )
                    else:  # flex
                        # For flex plays with ties that reduce to 1 effective pick, treat as loss
                        if effective_pick_count < 2:
                            payout = 0.0
                        else:
                            payout = (
                                get_flex_multiplier(effective_pick_count, hit_count)
                                * stake
                            )

                    logger.info(
                        f"Parlay {parlay_res[0]} resolution triggered by pick {pick_id}, payout: {payout}"
                    )

                    # Update parlay as resolved (safe due to FOR UPDATE lock)
                    update_parlay_query = """
                        UPDATE parlay
                        SET payout = %s, resolved = true
                        WHERE id = %s
                    """

                    await cur.execute(update_parlay_query, (payout, parlay_res[0]))

                    # Update user balance
                    user_context = None
                    if parlay_res[4]:  # match_user_id
                        # Update match user balance atomically
                        update_balance_query = """
                            UPDATE match_user
                            SET balance = balance + %s
                            WHERE id = %s
                        """

                        await cur.execute(
                            update_balance_query, (payout, parlay_res[4])
                        )

                        # Check if the update affected any rows
                        if cur.rowcount == 0:
                            logger.error(f"No match_user found with id {parlay_res[4]} - balance not updated")
                        else:
                            logger.info(f"Updated balance for match_user {parlay_res[4]} by {payout} (affected {cur.rowcount} rows)")

                        user_context = {
                            "type": "match",
                            "match_id": parlay_res[7],  # match_id
                            "user_id": parlay_res[8],  # match_user_user_id
                        }

                    elif parlay_res[5]:  # dynasty_league_user_id
                        # Update dynasty league user balance atomically
                        update_balance_query = """
                            UPDATE dynasty_league_user
                            SET balance = balance + %s
                            WHERE id = %s
                        """

                        await cur.execute(
                            update_balance_query, (payout, parlay_res[5])
                        )

                        # Check if the update affected any rows
                        if cur.rowcount == 0:
                            logger.error(f"No dynasty_league_user found with id {parlay_res[5]} - balance not updated")
                        else:
                            logger.info(f"Updated balance for dynasty_league_user {parlay_res[5]} by {payout} (affected {cur.rowcount} rows)")

                        user_context = {
                            "type": "dynasty_league",
                            "dynasty_league_id": parlay_res[10],  # dynasty_league_id
                            "user_id": parlay_res[11],  # dynasty_league_user_user_id
                        }

                    await cur.execute("COMMIT")

                    # Publish Redis messages for cache invalidation and real-time updates
                    if user_context:
                        await _publish_parlay_resolved_messages(
                            redis_publisher, parlay_res[0], user_context
                        )

                except Exception as e:
                    await cur.execute("ROLLBACK")
                    logger.error(f"Database transaction failed: {e}")
                    raise e

    except Exception as e:
        logger.error(f"Error handling pick resolved: {e}")
    finally:
        await redis_publisher.aclose()

    end_time = time()
    logger.info(
        f"Updated parlay of pick_id {pick_id}. Completed in {end_time - start_time:.2f}s"
    )


async def _publish_parlay_resolved_messages(
    redis_publisher, parlay_id: int, user_context: dict
):
    """Publish Redis messages for parlay resolution"""
    publish_tasks = []

    if user_context["type"] == "match":
        # Invalidate cache queries
        invalidation_keys = [
            ["parlay", parlay_id],
            ["parlays", "match", user_context["match_id"], user_context["user_id"]],
            ["match", user_context["match_id"]],
            ["match-ids", user_context["user_id"], "unresolved"],
            ["career", user_context["user_id"]],
        ]

        publish_tasks.append(
            publish_message_async(
                redis_publisher, "invalidate_queries", {"keys": invalidation_keys}
            )
        )

        publish_tasks.append(
            publish_message_async(
                redis_publisher,
                "notification",
                {
                    "receiverIdsList": [user_context["user_id"]],
                    "event": "match-parlay-resolved",
                    "data": {
                        "matchId": user_context["match_id"],
                        "parlayId": parlay_id,
                    },
                },
            )
        )

    elif user_context["type"] == "dynasty_league":
        # Invalidate cache queries
        invalidation_keys = [
            ["parlay", parlay_id],
            [
                "parlays",
                "dynasty-league",
                user_context["dynasty_league_id"],
                user_context["user_id"],
            ],
            ["dynasty-league", user_context["dynasty_league_id"], "users"],
            ["career", user_context["user_id"]],
        ]

        publish_tasks.append(
            publish_message_async(
                redis_publisher, "invalidate_queries", {"keys": invalidation_keys}
            )
        )

        publish_tasks.append(
            publish_message_async(
                redis_publisher,
                "notification",
                {
                    "receiverIdsList": [user_context["user_id"]],
                    "event": "dynasty-league-parlay-resolved",
                    "data": {
                        "dynastyLeagueId": user_context["dynasty_league_id"],
                        "parlayId": parlay_id,
                    },
                },
            )
        )

    # Execute all Redis publishes in parallel
    if publish_tasks:
        await asyncio.gather(*publish_tasks)


async def handle_pick_resolved_safe(data):
    """Safe wrapper for handle_pick_resolved that prevents listener crashes"""
    async with _semaphore:
        try:
            await handle_pick_resolved(data)
        except Exception as e:
            logger.error(f"Error handling pick_resolved message: {e}", exc_info=True)


async def listen_for_pick_resolved():
    """Function that listens for a pick_resolved message on redis"""
    while True:
        redis_subscriber = None
        try:
            redis_subscriber = await create_async_redis_client()
            logger.info("Listening for pick_resolved messages...")
            await listen_for_messages_async(
                redis_subscriber, "pick_resolved", handle_pick_resolved_safe
            )
        except Exception as e:
            logger.error(f"Error in listener, restarting: {e}")
            await asyncio.sleep(5)  # Brief delay before restart
        finally:
            if redis_subscriber:
                await redis_subscriber.aclose()


async def main():
    """Main function that listens for pick_resolved messages."""
    try:
        await listen_for_pick_resolved()
    except KeyboardInterrupt:
        logger.warning("Shutting down parlays_worker...")
        # Ensure pool cleanup on shutdown
        from db.connection import close_async_pool

        await close_async_pool()
    except Exception as e:
        logger.error(f"Error in main: {e}")
        # Ensure pool cleanup on error
        from db.connection import close_async_pool

        await close_async_pool()


if __name__ == "__main__":
    asyncio.run(main())
