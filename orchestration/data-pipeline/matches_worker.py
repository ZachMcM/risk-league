from utils import setup_logger
from redis_utils import create_async_redis_client, publish_message_async, listen_for_messages_async
from db.connection import get_async_connection_context
import asyncio
from typing import TypedDict, Optional, List, Tuple
from datetime import datetime

logger = setup_logger(__name__)

# Constants from server config
MIN_PARLAYS_REQUIRED = 2
MIN_PCT_TOTAL_STAKED = 0.6
K = 32  # Elo rating constant


class MatchUserResult(TypedDict):
    id: int
    user_id: str
    balance: float
    starting_balance: float
    points_snapshot: float
    points_delta: float
    status: str
    parlays: List[dict]


class MatchResult(TypedDict):
    id: int
    type: str
    league: str
    resolved: bool
    match_users: List[MatchUserResult]


class UserResult(TypedDict):
    id: str
    points: float


class BattlePassProgress(TypedDict):
    battle_pass_id: int
    user_battle_pass_progress_id: int
    current_xp: int


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

async def handle_parlay_resolved(data):
    """Handles incoming parlay_resolved messages asynchronously"""
    parlay_id = data.get("parlayId")
    if not parlay_id:
        logger.error("Received parlay_resolved message without parlayId")
        return

    redis_publisher = await create_async_redis_client()

    try:
        async with await get_async_connection_context() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute("BEGIN")

                    # Verify parlay exists
                    parlay_check_query = """
                        SELECT id
                        FROM parlay
                        WHERE id = %s
                    """

                    await cur.execute(parlay_check_query, (parlay_id,))
                    parlay_res = await cur.fetchone()

                    if not parlay_res:
                        logger.warning(f"No parlay found with id {parlay_id}")
                        await cur.execute("ROLLBACK")
                        return

                    # Get match with all related data
                    match_query = """
                        SELECT DISTINCT
                            m.id as match_id,
                            m.type as match_type,
                            m.league as match_league,
                            m.resolved as match_resolved
                        FROM parlay p
                        JOIN match_user mu ON p.match_user_id = mu.id
                        JOIN match m ON mu.match_id = m.id
                        WHERE p.id = %s
                    """

                    await cur.execute(match_query, (parlay_id,))
                    match_res = await cur.fetchone()

                    if not match_res:
                        logger.error(f"No match found for parlay {parlay_id}")
                        await cur.execute("ROLLBACK")
                        return

                    match_id = match_res[0]

                    # Check if match is already resolved
                    if match_res[3]:  # match_resolved
                        logger.info(f"Match {match_id} is already resolved")
                        await cur.execute("COMMIT")
                        return

                    # Get all match users with parlays
                    match_users_query = """
                        SELECT
                            mu.id as match_user_id,
                            mu.user_id,
                            mu.balance,
                            mu.starting_balance,
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
                        await cur.execute("ROLLBACK")
                        return

                    # Get parlays for each match user
                    match_users_data = []
                    for mu_row in match_users_res:
                        parlays_query = """
                            SELECT id, stake, resolved, profit
                            FROM parlay
                            WHERE match_user_id = %s
                        """

                        await cur.execute(parlays_query, (mu_row[0],))
                        parlays_res = await cur.fetchall()

                        parlays = [
                            {
                                "id": p[0],
                                "stake": float(p[1]),
                                "resolved": p[2],
                                "profit": float(p[3]) if p[3] is not None else None
                            }
                            for p in parlays_res
                        ]

                        match_users_data.append({
                            "id": mu_row[0],
                            "user_id": mu_row[1],
                            "balance": float(mu_row[2]),
                            "starting_balance": float(mu_row[3]),
                            "points_snapshot": float(mu_row[4]),
                            "points_delta": float(mu_row[5]),
                            "status": mu_row[6],
                            "parlays": parlays
                        })

                    # Check if all parlays are resolved
                    for mu_data in match_users_data:
                        for parlay in mu_data["parlays"]:
                            if not parlay["resolved"]:
                                logger.info(f"Match {match_id} cannot be resolved - parlay {parlay['id']} not resolved")
                                await cur.execute("COMMIT")
                                return

                    # Check if props are still available (simplified check)
                    # In production, you might want to implement the full getAvailablePropsForUser logic
                    props_available_query = """
                        SELECT COUNT(*) as available_count
                        FROM prop p
                        JOIN game g ON p.game_id = g.game_id
                        WHERE g.league = %s
                        AND p.status = 'not_resolved'
                        AND g.start_time > NOW()
                    """

                    await cur.execute(props_available_query, (match_res[2],))  # match_league
                    props_count_res = await cur.fetchone()

                    if props_count_res and props_count_res[0] > 0:
                        logger.info(f"Match {match_id} cannot be resolved - props still available")
                        await cur.execute("COMMIT")
                        return

                    logger.info(f"Match {match_id} resolution triggered by parlay {parlay_id}")

                    # Resolve the match
                    await _resolve_match(
                        cur, match_id, match_res[1], match_res[2], match_users_data
                    )

                    await cur.execute("COMMIT")

                    # Publish Redis messages for cache invalidation
                    await _publish_match_resolved_messages(
                        redis_publisher, match_id, match_users_data
                    )

                except Exception as e:
                    await cur.execute("ROLLBACK")
                    logger.error(f"Database transaction failed: {e}")
                    raise e

    except Exception as e:
        logger.error(f"Error handling parlay resolved: {e}")
    finally:
        await redis_publisher.close()


async def _resolve_match(
    cur, match_id: int, match_type: str, match_league: str, match_users_data: List[dict]
):
    """Resolve match by determining winner and updating all related data"""
    # Update match as resolved
    await cur.execute(
        "UPDATE match SET resolved = true WHERE id = %s", (match_id,)
    )

    match_user1 = match_users_data[0]
    match_user2 = match_users_data[1]

    # Calculate total stakes
    match_user1_total_staked = sum(p["stake"] for p in match_user1["parlays"])
    match_user2_total_staked = sum(p["stake"] for p in match_user2["parlays"])

    # Calculate minimum required stakes
    match_user1_min_staked = round(match_user1["starting_balance"] * MIN_PCT_TOTAL_STAKED)
    match_user2_min_staked = round(match_user2["starting_balance"] * MIN_PCT_TOTAL_STAKED)

    # Determine winner and statuses
    winner = None
    match_user1_status = None
    match_user2_status = None

    # Check disqualification conditions
    user1_disqualified = (
        len(match_user1["parlays"]) < MIN_PARLAYS_REQUIRED or
        match_user1_total_staked < match_user1_min_staked
    )
    user2_disqualified = (
        len(match_user2["parlays"]) < MIN_PARLAYS_REQUIRED or
        match_user2_total_staked < match_user2_min_staked
    )

    if user1_disqualified and not user2_disqualified:
        match_user1_status = "disqualified"
        match_user2_status = "win"
        winner = 1
    elif user2_disqualified and not user1_disqualified:
        match_user1_status = "win"
        match_user2_status = "disqualified"
        winner = 0
    elif user1_disqualified and user2_disqualified:
        match_user1_status = "disqualified"
        match_user2_status = "disqualified"
    elif match_user1["balance"] > match_user2["balance"]:
        match_user1_status = "win"
        match_user2_status = "loss"
        winner = 0
    elif match_user1["balance"] == match_user2["balance"]:
        match_user1_status = "draw"
        match_user2_status = "draw"
    else:
        match_user1_status = "loss"
        match_user2_status = "win"
        winner = 1

    # Update match user statuses
    await cur.execute(
        "UPDATE match_user SET status = %s WHERE id = %s",
        (match_user1_status, match_user1["id"])
    )
    await cur.execute(
        "UPDATE match_user SET status = %s WHERE id = %s",
        (match_user2_status, match_user2["id"])
    )

    # Update ELO points for competitive matches
    if match_type == "competitive":
        await _update_elo_points(
            cur, match_user1, match_user2, match_user1_status, match_user2_status, winner
        )

    # Update battle pass XP
    await _update_battle_pass_xp(
        cur, match_user1["user_id"], len(match_user1["parlays"]), match_user1_total_staked, match_user1_status
    )
    await _update_battle_pass_xp(
        cur, match_user2["user_id"], len(match_user2["parlays"]), match_user2_total_staked, match_user2_status
    )


async def _update_elo_points(
    cur, match_user1: dict, match_user2: dict, status1: str, status2: str, winner: Optional[int]
):
    """Update ELO points for competitive matches"""
    if status1 == "disqualified" and status2 == "disqualified":
        return

    # Get current user points
    await cur.execute(
        "SELECT points FROM user WHERE id = %s", (match_user1["user_id"],)
    )
    user1_points_res = await cur.fetchone()

    await cur.execute(
        "SELECT points FROM user WHERE id = %s", (match_user2["user_id"],)
    )
    user2_points_res = await cur.fetchone()

    if not user1_points_res or not user2_points_res:
        return

    current_points = [float(user1_points_res[0]), float(user2_points_res[0])]
    new_points = recalculate_points(current_points, winner)

    # Update match user points deltas
    points_delta1 = max(0, new_points[0] - current_points[0])
    points_delta2 = max(0, new_points[1] - current_points[1])

    await cur.execute(
        "UPDATE match_user SET points_delta = %s WHERE id = %s",
        (points_delta1, match_user1["id"])
    )
    await cur.execute(
        "UPDATE match_user SET points_delta = %s WHERE id = %s",
        (points_delta2, match_user2["id"])
    )

    # Update user points (minimum 1000)
    await cur.execute(
        "UPDATE user SET points = %s WHERE id = %s",
        (max(1000, new_points[0]), match_user1["user_id"])
    )
    await cur.execute(
        "UPDATE user SET points = %s WHERE id = %s",
        (max(1000, new_points[1]), match_user2["user_id"])
    )


async def _update_battle_pass_xp(
    cur, user_id: str, parlay_count: int, total_staked: float, match_status: str
):
    """Update battle pass XP for a user"""
    now = datetime.now().isoformat()

    # Get active battle passes for user
    battle_pass_query = """
        SELECT
            ubp.battle_pass_id,
            ubp.id as user_battle_pass_progress_id,
            ubp.current_xp
        FROM user_battle_pass_progress ubp
        JOIN battle_pass bp ON ubp.battle_pass_id = bp.id
        WHERE bp.is_active = true
        AND bp.start_date <= %s
        AND bp.end_date >= %s
        AND ubp.user_id = %s
    """

    await cur.execute(battle_pass_query, (now, now, user_id))
    battle_passes_res = await cur.fetchall()

    if not battle_passes_res:
        return  # No active battle passes

    # Calculate XP
    base_xp = 50
    parlay_bonus = parlay_count * 10
    staking_bonus = int(total_staked / 10)

    multiplier = {
        "win": 1.5,
        "draw": 1.2,
        "loss": 1.0,
        "disqualified": 0.5
    }.get(match_status, 1.0)

    total_xp = int((base_xp + parlay_bonus + staking_bonus) * multiplier)
    xp_gained = max(25, total_xp)

    # Update each active battle pass
    for bp_row in battle_passes_res:
        battle_pass_id, progress_id, current_xp = bp_row
        new_xp = (current_xp or 0) + xp_gained

        await cur.execute(
            "UPDATE user_battle_pass_progress SET current_xp = %s WHERE id = %s",
            (new_xp, progress_id)
        )


async def _publish_match_resolved_messages(
    redis_publisher, match_id: int, match_users_data: List[dict]
):
    """Publish Redis messages for match resolution"""
    publish_tasks = []

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
        ["career", user2_id]
    ]

    publish_tasks.append(
        publish_message_async(
            redis_publisher,
            "invalidate_queries",
            {"keys": invalidation_keys}
        )
    )

    # Execute all Redis publishes in parallel
    if publish_tasks:
        await asyncio.gather(*publish_tasks)


async def listen_for_parlay_resolved():
    """Function that listens for a parlay_resolved message on redis"""
    redis_subscriber = await create_async_redis_client()

    try:
        logger.info("Listening for parlay_resolved messages...")
        await listen_for_messages_async(
            redis_subscriber, "parlay_resolved", handle_parlay_resolved
        )
    except Exception as e:
        logger.error(f"Error in listener: {e}")
    finally:
        await redis_subscriber.close()


async def main():
    """Main function that listens for parlay_resolved messages."""
    try:
        await listen_for_parlay_resolved()
    except KeyboardInterrupt:
        logger.warning("Shutting down matches_worker...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    asyncio.run(main())
