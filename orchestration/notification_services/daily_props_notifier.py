from utils import setup_logger, async_server_req
from db.connection import get_async_pool, close_async_pool
import asyncio
from time import time
import traceback

logger = setup_logger(__name__)


async def check_and_notify_available_props():
    """Check for available props and notify all users if any exist"""
    start_time = time()
    logger.info("Checking for available props...")

    pool = await get_async_pool()

    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                # Get unique leagues with available props for today
                props_query = """
                    SELECT DISTINCT g.league
                    FROM prop p
                    JOIN game g ON p.game_id = g.game_id
                    WHERE p.status = 'not_resolved'
                    AND g.start_time AT TIME ZONE 'UTC' > (NOW() AT TIME ZONE 'UTC')
                    ORDER BY g.league
                """

                await cur.execute(props_query)
                leagues_res = await cur.fetchall()

                leagues = [row[0] for row in leagues_res]

                if len(leagues) == 0:
                    logger.info("No available props found for today")
                    return

                logger.info(f"Found {len(leagues)} league(s) with available props: {leagues}")

                # Format the body message
                if len(leagues) == 1:
                    leagues_text = leagues[0]
                elif len(leagues) == 2:
                    leagues_text = f"{leagues[0]} or {leagues[1]}"
                else:
                    leagues_text = ", ".join(leagues[:-1]) + f", or {leagues[-1]}"

                body = f"Start a {leagues_text} match right now!"

                # Get all users
                users_query = """
                    SELECT DISTINCT id
                    FROM public.user
                """

                await cur.execute(users_query)
                users_res = await cur.fetchall()

                user_ids = [row[0] for row in users_res]

                # Ensure no duplicates in the list
                user_ids = list(set(user_ids))

                if len(user_ids) == 0:
                    logger.info("No users found to notify")
                    return

                logger.info(f"Sending notification to {len(user_ids)} unique user(s)")
                logger.debug(f"User IDs: {user_ids}")

                # Send notification to all users via HTTP
                logger.info("Sending push notification via HTTP...")
                await async_server_req(
                    route="/push-notifications",
                    method="POST",
                    body={
                        "receiverIdsList": user_ids,
                        "pushNotification": {
                            "title": "Start a Match!",
                            "body": body,
                            "data": {
                                "url": None
                            }
                        },
                    },
                )

                logger.info(f"Successfully sent notification to {len(user_ids)} recipients")

    except Exception as e:
        logger.error(f"Error checking available props: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")

    end_time = time()
    logger.info(
        f"Props availability check completed in {end_time - start_time:.2f}s"
    )


async def main():
    """Main function that runs once and exits"""
    try:
        await check_and_notify_available_props()
    except Exception as e:
        logger.error(f"Error in main: {e}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
    finally:
        await close_async_pool()


if __name__ == "__main__":
    asyncio.run(main())
