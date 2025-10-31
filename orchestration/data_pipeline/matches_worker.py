from utils import setup_logger, async_server_req
from redis_utils import (
    create_async_redis_client,
    publish_message_async,
    listen_for_messages_async,
)
from db.connection import get_async_pool
import asyncio
from typing import TypedDict, Optional, List, Dict
from time import time
import traceback

logger = setup_logger(__name__)

K = 32  # Elo rating constant


class PickResult(TypedDict):
    id: int
    status: str
    match_user_id: int
    choice: str
    prop_id: int


class MatchUserResult(TypedDict):
    id: int
    user_id: str
    points_snapshot: float
    points_delta: float
    status: str
    picks: List[PickResult]


class MatchResult(TypedDict):
    id: int
    type: str
    league: str
    resolved: bool
    match_users: List[MatchUserResult]


def recalculate_points(current_points: List[float], winner: Optional[int]) -> List[int]:
    """Recalculates ELO points based on match winner using Arpad Elo formula"""
    r_a = current_points[0]
    r_b = current_points[1]

    if winner is None:
        s_a = s_b = 0.5  # Draw
    else:
        s_a = 1.0 if winner == 0 else 0.0
        s_b = 1.0 - s_a

    # Probability calculations
    e_a = 1 / (1 + pow(10, (r_b - r_a) / 400))
    e_b = 1 - e_a

    # New ratings
    r_prime_a = r_a + K * (s_a - e_a)
    r_prime_b = r_b + K * (s_b - e_b)

    return [round(r_prime_a), round(r_prime_b)]


def calculate_score_for_picks(picks: List[Dict]) -> float:
    """Calculate score based on picks - same logic as server/src/routes/matches.ts"""
    score = 0.0
    for pick in picks:
        if pick["prop_status"] != "resolved":
            continue

        if pick["choice"] == "over":
            score += pick["current_value"] - pick["line"]
        else:
            score += pick["line"] - pick["current_value"]

    return score


async def handle_prop_updated(data):
    """Handle incoming prop_updated messages - updates pick statuses and triggers match resolution"""
    start_time = time()
    prop_id = data.get("id")
    if not prop_id:
        logger.error("Received prop_updated message without id")
        return

    redis_publisher = await create_async_redis_client()
    matches_to_check = set()

    try:
        pool = await get_async_pool()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute("BEGIN")

                    # Get the updated prop
                    select_query = """
                        SELECT id, current_value, line, status
                        FROM prop
                        WHERE id = %s
                    """

                    await cur.execute(select_query, (prop_id,))
                    prop_query_res = await cur.fetchone()

                    if not prop_query_res:
                        logger.warning(f"No prop found with id {prop_id}")
                        await cur.execute("ROLLBACK")
                        return

                    updated_prop = {
                        "id": prop_query_res[0],
                        "current_value": prop_query_res[1],
                        "line": prop_query_res[2],
                        "status": prop_query_res[3],
                    }

                    # Update pick statuses based on prop status
                    if updated_prop["status"] == "did_not_play":
                        update_stmt = """
                            UPDATE pick
                            SET status = 'did_not_play'::pick_status
                            WHERE prop_id = %s
                            RETURNING id, match_user_id
                        """
                        await cur.execute(update_stmt, (updated_prop["id"],))
                        updated_picks = await cur.fetchall()

                        for pick in updated_picks:
                            matches_to_check.add(pick[1])  # match_user_id

                    elif updated_prop["status"] == "resolved":
                        if updated_prop["current_value"] > updated_prop["line"]:
                            # Over hits, under misses
                            batch_update_stmt = """
                                WITH updates AS (
                                    UPDATE pick SET status = CASE
                                        WHEN choice = 'over' THEN 'hit'::pick_status
                                        WHEN choice = 'under' THEN 'missed'::pick_status
                                    END
                                    WHERE prop_id = %s AND choice IN ('over', 'under')
                                    RETURNING id, match_user_id
                                )
                                SELECT id, match_user_id FROM updates
                            """
                            await cur.execute(batch_update_stmt, (updated_prop["id"],))
                            updated_picks = await cur.fetchall()

                            for pick in updated_picks:
                                matches_to_check.add(pick[1])

                        elif updated_prop["current_value"] == updated_prop["line"]:
                            # Tie
                            ties_update_stmt = """
                                UPDATE pick
                                SET status = 'tie'::pick_status
                                WHERE prop_id = %s
                                RETURNING id, match_user_id
                            """
                            await cur.execute(ties_update_stmt, (updated_prop["id"],))
                            updated_picks = await cur.fetchall()

                            for pick in updated_picks:
                                matches_to_check.add(pick[1])

                        else:
                            # Under hits, over misses
                            batch_update_stmt = """
                                WITH updates AS (
                                    UPDATE pick SET status = CASE
                                        WHEN choice = 'over' THEN 'missed'::pick_status
                                        WHEN choice = 'under' THEN 'hit'::pick_status
                                    END
                                    WHERE prop_id = %s AND choice IN ('over', 'under')
                                    RETURNING id, match_user_id
                                )
                                SELECT id, match_user_id FROM updates
                            """
                            await cur.execute(batch_update_stmt, (updated_prop["id"],))
                            updated_picks = await cur.fetchall()

                            for pick in updated_picks:
                                matches_to_check.add(pick[1])

                    await cur.execute("COMMIT")

                    # Get match IDs from match_user_ids and check for resolution
                    if matches_to_check:
                        match_ids_query = """
                            SELECT DISTINCT match_id
                            FROM match_user
                            WHERE id = ANY(%s)
                        """
                        await cur.execute(match_ids_query, (list(matches_to_check),))
                        match_ids = [row[0] for row in await cur.fetchall()]

                        # Trigger match resolution checks for affected matches
                        for match_id in match_ids:
                            await _check_and_resolve_match(cur, redis_publisher, match_id)

                except Exception as e:
                    await cur.execute("ROLLBACK")
                    logger.error(f"Database transaction failed: {e}")
                    raise e

    except Exception as e:
        logger.error(f"Error handling prop update: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
    finally:
        await redis_publisher.aclose()

    end_time = time()
    if matches_to_check:
        logger.info(
            f"Updated picks for prop_id {prop_id}, checked {len(matches_to_check)} match_users. Completed in {end_time - start_time:.2f}s"
        )


async def _check_and_resolve_match(cur, redis_publisher, match_id: int):
    """Check if a match is ready to be resolved and resolve it if so"""
    try:
        # Get match info
        match_query = """
            SELECT id, type, league, resolved
            FROM match
            WHERE id = %s
        """
        await cur.execute(match_query, (match_id,))
        match_res = await cur.fetchone()

        if not match_res:
            logger.warning(f"No match found with id {match_id}")
            return

        # Skip if already resolved
        if match_res[3]:  # resolved
            return

        # Acquire exclusive lock on match to prevent concurrent resolution
        await cur.execute(
            "SELECT id FROM match WHERE id = %s AND resolved = false FOR UPDATE",
            (match_id,)
        )
        lock_result = await cur.fetchone()
        if not lock_result:
            logger.info(f"Match {match_id} is already resolved")
            return

        # Get all match users with their picks
        match_users_query = """
            SELECT
                mu.id as match_user_id,
                mu.user_id,
                mu.points_snapshot,
                mu.points_delta,
                mu.status
            FROM match_user mu
            WHERE mu.match_id = %s
            ORDER BY mu.id
        """
        await cur.execute(match_users_query, (match_id,))
        match_users_res = await cur.fetchall()

        if len(match_users_res) != 2:
            logger.error(f"Match {match_id} does not have exactly 2 users")
            return

        # Get picks for each match user
        match_users_data = []
        for mu_row in match_users_res:
            picks_query = """
                SELECT
                    p.id,
                    p.status,
                    p.choice,
                    pr.current_value,
                    pr.line,
                    pr.status as prop_status
                FROM pick p
                JOIN prop pr ON p.prop_id = pr.id
                WHERE p.match_user_id = %s
            """
            await cur.execute(picks_query, (mu_row[0],))
            picks_res = await cur.fetchall()

            picks = [
                {
                    "id": p[0],
                    "status": p[1],
                    "choice": p[2],
                    "current_value": float(p[3]),
                    "line": float(p[4]),
                    "prop_status": p[5],
                }
                for p in picks_res
            ]

            match_users_data.append({
                "id": mu_row[0],
                "user_id": mu_row[1],
                "points_snapshot": float(mu_row[2]),
                "points_delta": float(mu_row[3]),
                "status": mu_row[4],
                "picks": picks,
            })

        # Check if all picks are resolved (excluding ties and DNPs)
        for mu_data in match_users_data:
            for pick in mu_data["picks"]:
                if pick["status"] == "not_resolved":
                    logger.info(
                        f"Match {match_id} cannot be resolved - pick {pick['id']} not resolved"
                    )
                    return

        # Check if props are still available for this league
        props_available_query = """
            SELECT COUNT(*) as available_count
            FROM prop p
            JOIN game g ON p.game_id = g.game_id AND p.league = g.league
            WHERE g.league = %s
            AND p.status = 'not_resolved'
            AND g.start_time AT TIME ZONE 'UTC' > (NOW() AT TIME ZONE 'UTC')
        """
        await cur.execute(props_available_query, (match_res[2],))  # league
        props_count_res = await cur.fetchone()

        if props_count_res and props_count_res[0] > 0:
            logger.info(
                f"Match {match_id} cannot be resolved - {props_count_res[0]} props still available"
            )
            return

        logger.info(f"Match {match_id} resolution triggered - all picks resolved and no props available")

        # Resolve the match
        await _resolve_match(cur, match_id, match_res[1], match_res[2], match_users_data)

        # Publish cache invalidation and notifications
        await _publish_match_resolved_messages(
            redis_publisher,
            match_id,
            match_users_data,
            match_res[1],
            match_res[2],
        )

    except Exception as e:
        logger.error(f"Error checking/resolving match {match_id}: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")


async def _resolve_match(
    cur, match_id: int, match_type: str, league: str, match_users_data: List[dict]
):
    """Resolve match by determining winner and updating all related data"""
    # Update match as resolved
    await cur.execute("UPDATE match SET resolved = true WHERE id = %s", (match_id,))

    match_user1 = match_users_data[0]
    match_user2 = match_users_data[1]

    # Calculate scores using the same logic as server/src/routes/matches.ts
    score1 = calculate_score_for_picks(match_user1["picks"])
    score2 = calculate_score_for_picks(match_user2["picks"])

    logger.info(f"Match {match_id} scores - User 1: {score1}, User 2: {score2}")

    # Determine winner and statuses based on scores
    winner = None
    match_user1_status = None
    match_user2_status = None

    if score1 > score2:
        match_user1_status = "win"
        match_user2_status = "loss"
        winner = 0
    elif score1 == score2:
        match_user1_status = "draw"
        match_user2_status = "draw"
    else:
        match_user1_status = "loss"
        match_user2_status = "win"
        winner = 1

    # Update match user statuses
    await cur.execute(
        "UPDATE match_user SET status = %s::match_status WHERE id = %s",
        (match_user1_status, match_user1["id"]),
    )
    await cur.execute(
        "UPDATE match_user SET status = %s::match_status WHERE id = %s",
        (match_user2_status, match_user2["id"]),
    )

    # Update ELO points for competitive matches
    if match_type == "competitive":
        await _update_elo_points(
            cur,
            match_user1,
            match_user2,
            match_user1_status,
            match_user2_status,
            winner,
        )

    logger.info(
        f"Match {match_id} resolved - User 1: {match_user1_status} ({score1}), User 2: {match_user2_status} ({score2})"
    )


async def _update_elo_points(
    cur,
    match_user1: dict,
    match_user2: dict,
    status1: str,
    status2: str,
    winner: Optional[int],
):
    """Update ELO points for competitive matches"""
    # Get current user points atomically using SELECT FOR UPDATE
    await cur.execute(
        "SELECT id, points FROM public.user WHERE id = %s FOR UPDATE",
        (match_user1["user_id"],)
    )
    user1_res = await cur.fetchone()

    await cur.execute(
        "SELECT id, points FROM public.user WHERE id = %s FOR UPDATE",
        (match_user2["user_id"],)
    )
    user2_res = await cur.fetchone()

    if not user1_res or not user2_res:
        return

    current_points = [float(user1_res[1]), float(user2_res[1])]

    new_points = recalculate_points(current_points, winner)

    # Calculate points deltas (can be negative for losses)
    points_delta1 = new_points[0] - current_points[0]
    points_delta2 = new_points[1] - current_points[1]

    # Update match user points deltas
    await cur.execute(
        "UPDATE match_user SET points_delta = %s WHERE id = %s",
        (points_delta1, match_user1["id"]),
    )
    await cur.execute(
        "UPDATE match_user SET points_delta = %s WHERE id = %s",
        (points_delta2, match_user2["id"]),
    )

    # Update user points atomically with minimum constraint
    await cur.execute(
        "UPDATE public.user SET points = GREATEST(1000, %s) WHERE id = %s",
        (new_points[0], match_user1["user_id"]),
    )
    await cur.execute(
        "UPDATE public.user SET points = GREATEST(1000, %s) WHERE id = %s",
        (new_points[1], match_user2["user_id"]),
    )


async def _publish_match_resolved_messages(
    redis_publisher,
    match_id: int,
    match_users_data: List[dict],
    match_type: str,
    league: str,
):
    """Publish cache invalidation via Redis and send push notifications via HTTP"""
    user1_id = match_users_data[0]["user_id"]
    user2_id = match_users_data[1]["user_id"]

    # Cache invalidation keys
    invalidation_keys = [
        ["match", match_id],
        ["match-ids", user1_id, "resolved"],
        ["match-ids", user2_id, "resolved"],
        ["match-ids", user1_id, "unresolved"],
        ["match-ids", user2_id, "unresolved"],
        ["user", user1_id],
        ["user", user2_id],
        ["user", user1_id, "rank"],
        ["user", user2_id, "rank"],
        ["career", user1_id],
        ["career", user2_id],
    ]

    # Publish cache invalidation via Redis and send notification via HTTP in parallel
    await asyncio.gather(
        publish_message_async(
            redis_publisher, "invalidate_queries", {"keys": invalidation_keys}
        ),
        async_server_req(
            route="/push-notifications",
            method="POST",
            body={
                "receiverIdsList": [user1_id, user2_id],
                "pushNotification": {
                    "title": "Match Ended",
                    "body": "Your match has ended. Check your results!",
                    "data": {
                        "url": f"/match/{match_id}"
                    }
                },
            },
        )
    )


async def handle_match_check(data):
    """Handles incoming match_check messages to manually trigger match resolution checks"""
    start_time = time()
    match_id = data.get("matchId")
    if not match_id:
        logger.error("Received match_check message without matchId")
        return

    redis_publisher = await create_async_redis_client()
    pool = await get_async_pool()

    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute("BEGIN")
                    await _check_and_resolve_match(cur, redis_publisher, match_id)
                    await cur.execute("COMMIT")
                except Exception as e:
                    await cur.execute("ROLLBACK")
                    logger.error(f"Database transaction failed: {e}")
                    raise e
    except Exception as e:
        logger.error(f"Error handling match check: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
    finally:
        await redis_publisher.aclose()

    end_time = time()
    logger.info(
        f"Processed match_check for match_id {match_id}. Completed in {end_time - start_time:.2f}s"
    )


async def handle_prop_updated_safe(data):
    """Safe wrapper for handle_prop_updated that prevents listener crashes"""
    try:
        await handle_prop_updated(data)
    except Exception as e:
        logger.error(f"Error handling prop_updated message: {e}", exc_info=True)
        logger.error(f"Full traceback: {traceback.format_exc()}")


async def handle_match_check_safe(data):
    """Safe wrapper for handle_match_check that prevents listener crashes"""
    try:
        await handle_match_check(data)
    except Exception as e:
        logger.error(f"Error handling match_check message: {e}", exc_info=True)
        logger.error(f"Full traceback: {traceback.format_exc()}")


async def listen_for_prop_updated():
    """Function that listens for prop_updated messages on redis"""
    while True:
        redis_subscriber = None
        try:
            redis_subscriber = await create_async_redis_client()
            logger.info("Listening for prop_updated messages...")
            await listen_for_messages_async(
                redis_subscriber, "prop_updated", handle_prop_updated_safe
            )
        except Exception as e:
            logger.error(f"Error in prop_updated listener, restarting: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            await asyncio.sleep(5)  # Brief delay before restart
        finally:
            if redis_subscriber:
                await redis_subscriber.aclose()


async def listen_for_match_check():
    """Function that listens for match_check messages on redis"""
    while True:
        redis_subscriber = None
        try:
            redis_subscriber = await create_async_redis_client()
            logger.info("Listening for match_check messages...")
            await listen_for_messages_async(
                redis_subscriber, "match_check", handle_match_check_safe
            )
        except Exception as e:
            logger.error(f"Error in match_check listener, restarting: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            await asyncio.sleep(5)  # Brief delay before restart
        finally:
            if redis_subscriber:
                await redis_subscriber.aclose()


async def main():
    """Main function that listens for both prop_updated and match_check messages."""
    try:
        # Run both listeners concurrently
        await asyncio.gather(listen_for_prop_updated(), listen_for_match_check())
    except KeyboardInterrupt:
        logger.warning("Shutting down matches_worker...")
        # Ensure pool cleanup on shutdown
        from db.connection import close_async_pool

        await close_async_pool()
    except Exception as e:
        logger.error(f"Error in main: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        # Ensure pool cleanup on error
        from db.connection import close_async_pool

        await close_async_pool()


if __name__ == "__main__":
    asyncio.run(main())
