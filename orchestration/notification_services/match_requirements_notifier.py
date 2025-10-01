from utils import setup_logger, async_server_req
from db.connection import get_async_pool
import asyncio
from typing import List, Dict
from time import time
import traceback

logger = setup_logger(__name__)

MIN_PARLAYS_REQUIRED = 2
MIN_PCT_TOTAL_STAKED = 0.5

async def check_and_notify_requirements():
    """Check all unresolved match users and notify if they haven't met requirements"""
    start_time = time()
    logger.info("Starting match requirements check...")

    pool = await get_async_pool()

    notifications_sent = 0

    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                # Get all unresolved match users with their match info
                query = """
                    SELECT
                        mu.id as match_user_id,
                        mu.user_id,
                        mu.starting_balance,
                        mu.match_id,
                        m.id as match_id,
                        m.resolved as match_resolved
                    FROM match_user mu
                    JOIN match m ON mu.match_id = m.id
                    WHERE mu.status = 'not_resolved'
                    AND m.resolved = false
                """

                await cur.execute(query)
                match_users = await cur.fetchall()

                logger.info(f"Found {len(match_users)} unresolved match users")

                for mu_row in match_users:
                    match_user_id = mu_row[0]
                    user_id = mu_row[1]
                    starting_balance = float(mu_row[2])
                    match_id = mu_row[4]

                    # Get parlays for this match user
                    parlays_query = """
                        SELECT id, stake, resolved
                        FROM parlay
                        WHERE match_user_id = %s
                    """

                    await cur.execute(parlays_query, (match_user_id,))
                    parlays_res = await cur.fetchall()

                    parlays = [
                        {
                            "id": p[0],
                            "stake": float(p[1]),
                            "resolved": p[2]
                        }
                        for p in parlays_res
                    ]

                    # Calculate requirements
                    total_staked = sum(p["stake"] for p in parlays)
                    min_required = round(starting_balance * MIN_PCT_TOTAL_STAKED)
                    parlay_count = len(parlays)

                    # Check if requirements are not met
                    needs_more_stake = total_staked < min_required
                    needs_more_parlays = parlay_count < MIN_PARLAYS_REQUIRED

                    if needs_more_stake or needs_more_parlays:
                        amount_needed = max(0, min_required - total_staked)

                        # Send notification via HTTP
                        await async_server_req(
                            route="/push-notifications",
                            method="POST",
                            body={
                                "receiverIdsList": [user_id],
                                "pushNotification": {
                                    "title": "You could get disqualified!",
                                    "body": f"You need to stake ${int(amount_needed)} more! Create another parlay right now!",
                                    "data": {
                                        "url": f"/match/{match_id}"
                                    }
                                },
                            },
                        )

                        notifications_sent += 1
                        logger.info(
                            f"Sent notification to user {user_id} for match {match_id} "
                            f"(needs ${amount_needed:.2f} more, {MIN_PARLAYS_REQUIRED - parlay_count} more parlays)"
                        )

    except Exception as e:
        logger.error(f"Error checking match requirements: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")

    end_time = time()
    logger.info(
        f"Match requirements check completed. Sent {notifications_sent} notifications. "
        f"Completed in {end_time - start_time:.2f}s"
    )


async def main():
    """Main function that runs the requirements check periodically"""
    try:
        while True:
            await check_and_notify_requirements()
            # Wait 2 hours before next check
            await asyncio.sleep(7200)
    except KeyboardInterrupt:
        logger.warning("Shutting down match_requirements_notifier...")
        from db.connection import close_async_pool
        await close_async_pool()
    except Exception as e:
        logger.error(f"Error in main: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        from db.connection import close_async_pool
        await close_async_pool()


if __name__ == "__main__":
    asyncio.run(main())
