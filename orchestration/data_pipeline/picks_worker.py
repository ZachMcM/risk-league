import asyncio
import logging
from time import time

from db.connection import get_async_pool
from redis_utils import (
    create_async_redis_client,
    listen_for_messages_async,
    publish_message_async,
)

logger = logging.getLogger(__name__)


async def handle_prop_updated(data):
    """Handle incoming prop_updated messages asynchronously"""
    start_time = time()
    prop_id = data.get("id")
    if not prop_id:
        logger.error("Received prop updated message without id")
        return

    # Create fresh Redis connection for this worker
    redis_publisher = await create_async_redis_client()
    picks_to_invalidate = []

    try:
        pool = await get_async_pool()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute("BEGIN")

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

                    if updated_prop["status"] == "did_not_play":
                        update_stmt = """
                            UPDATE pick SET status = 'did_not_play'::pick_status
                            WHERE prop_id = %s
                            RETURNING id, parlay_id
                        """

                        await cur.execute(update_stmt, (updated_prop["id"],))
                        dnp_res_list = await cur.fetchall()

                        for res in dnp_res_list:
                            picks_to_invalidate.append(
                                {"id": res[0], "parlay_id": res[1]}
                            )

                    elif updated_prop["status"] == "resolved":
                        if updated_prop["current_value"] > updated_prop["line"]:
                            batch_update_stmt = """
                                WITH updates AS (
                                    UPDATE pick SET status = CASE
                                        WHEN choice = 'over' THEN 'hit'::pick_status
                                        WHEN choice = 'under' THEN 'missed'::pick_status
                                    END
                                    WHERE prop_id = %s AND choice IN ('over', 'under')
                                    RETURNING id, parlay_id
                                )
                                SELECT id, parlay_id FROM updates
                            """

                            await cur.execute(batch_update_stmt, (updated_prop["id"],))
                            batch_res_list = await cur.fetchall()

                            for res in batch_res_list:
                                picks_to_invalidate.append(
                                    {"id": res[0], "parlay_id": res[1]}
                                )

                        elif updated_prop["current_value"] == updated_prop["line"]:
                            ties_update_stmt = """
                                UPDATE pick SET status = 'tie'::pick_status
                                WHERE prop_id = %s
                                RETURNING id, parlay_id
                            """

                            await cur.execute(ties_update_stmt, (updated_prop["id"],))
                            ties_res_list = await cur.fetchall()

                            for ties_res in ties_res_list:
                                picks_to_invalidate.append(
                                    {"id": ties_res[0], "parlay_id": ties_res[1]}
                                )
                        else:
                            batch_update_stmt = """
                                WITH updates AS (
                                    UPDATE pick SET status = CASE
                                        WHEN choice = 'over' THEN 'missed'::pick_status
                                        WHEN choice = 'under' THEN 'hit'::pick_status
                                    END
                                    WHERE prop_id = %s AND choice IN ('over', 'under')
                                    RETURNING id, parlay_id
                                )
                                SELECT id, parlay_id FROM updates
                            """

                            await cur.execute(batch_update_stmt, (updated_prop["id"],))
                            batch_res_list = await cur.fetchall()

                            for res in batch_res_list:
                                picks_to_invalidate.append(
                                    {"id": res[0], "parlay_id": res[1]}
                                )

                    else:
                        related_picks_query = """
                            SELECT id, parlay_id
                            FROM pick
                            WHERE prop_id = %s
                        """

                        await cur.execute(related_picks_query, (updated_prop["id"],))
                        related_picks_res_list = await cur.fetchall()

                        for related_picks_res in related_picks_res_list:
                            picks_to_invalidate.append(
                                {
                                    "id": related_picks_res[0],
                                    "parlay_id": related_picks_res[1],
                                }
                            )

                    await cur.execute("COMMIT")

                except Exception as e:
                    await cur.execute("ROLLBACK")
                    logger.error(f"Database transaction failed: {e}")
                    raise e

        # Publish all Redis messages in parallel
        if picks_to_invalidate:
            publish_tasks = []
            for pick in picks_to_invalidate:
                publish_tasks.append(
                    publish_message_async(
                        redis_publisher, "pick_resolved", {"id": pick["id"]}
                    )
                )
                publish_tasks.append(
                    publish_message_async(
                        redis_publisher,
                        "invalidate_queries",
                        {"keys": [["pick", pick["id"]], ["parlay", pick["parlay_id"]]]},
                    )
                )
            await asyncio.gather(*publish_tasks)

    except Exception as e:
        logger.error(f"Error handling prop update: {e}")
    finally:
        await redis_publisher.aclose()

    end_time = time()
    if picks_to_invalidate:
        logger.info(
            f"Updated/invalidated {len(picks_to_invalidate)} picks related to prop_id {prop_id}. Completed in {end_time - start_time:.2f}s"
        )
    else:
        logger.info(
            f"No picks to update for prop_id {prop_id}. Completed in {end_time - start_time:.2f}s"
        )


async def handle_prop_updated_safe(data):
    """Safe wrapper for handle_prop_updated that prevents listener crashes"""
    try:
        await handle_prop_updated(data)
    except Exception as e:
        logger.error(f"Error handling prop_updated message: {e}", exc_info=True)


async def listen_for_prop_updated():
    """Function that listens for a prop updated message on the redis server"""
    while True:
        redis_subscriber = None
        try:
            redis_subscriber = await create_async_redis_client()
            logger.info("Listening for prop updated messages...")
            await listen_for_messages_async(
                redis_subscriber, "prop_updated", handle_prop_updated_safe
            )
        except Exception as e:
            logger.error(f"Error in listener, restarting: {e}")
            await asyncio.sleep(5)  # Brief delay before restart
        finally:
            if redis_subscriber:
                await redis_subscriber.aclose()


async def main():
    """Main function that listens for prop updated messages."""
    try:
        await listen_for_prop_updated()
    except KeyboardInterrupt:
        logger.warning("Shutting down picks_worker...")
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
