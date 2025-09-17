from utils import setup_logger, server_req, getenv_required
from redis_utils import listen_for_messages, create_redis_client
import concurrent.futures
from db.connection import get_connection_context
import json

logger = setup_logger(__name__)

# Redis connections will be created per-worker to avoid fork issues

PICKS_UPDATER_MAX_WORKERS = int(getenv_required("PICKS_UPDATER_MAX_WORKERS"))


def handle_prop_updated(data):
    """Handle incoming prop_updated messages"""
    prop_id = data.get("id")
    if not prop_id:
        logger.error("Received prop updated message without id")
        return

    # Create fresh Redis connection for this worker
    redis_publisher = create_redis_client()
    picks_to_invalidate = []

    with get_connection_context() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("BEGIN")

                select_query = """
                    SELECT id, current_value, line, status
                    FROM prop
                    WHERE id = %s
                """

                cur.execute(select_query, (prop_id,))
                prop_query_res = cur.fetchone()

                if not prop_query_res:
                    logger.warning(f"No prop found with id {prop_id}")
                    cur.execute("ROLLBACK")
                    return

                updated_prop = {
                    "id": prop_query_res[0],
                    "current_value": prop_query_res[1],
                    "line": prop_query_res[2],
                    "status": prop_query_res[3],
                }

                if updated_prop["status"] == "did_not_play":
                    update_stmt = """
                        UPDATE pick SET status = 'did_not_play'
                        WHERE prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(update_stmt, (updated_prop["id"],))
                    dnp_res_list = cur.fetchall()

                    for res in dnp_res_list:
                        picks_to_invalidate.append({"id": res[0], "parlay_id": res[1]})

                elif updated_prop["status"] == "resolved":
                    if updated_prop["current_value"] > updated_prop["line"]:
                        batch_update_stmt = """
                            WITH updates AS (
                                UPDATE pick SET status = CASE
                                    WHEN choice = 'over' THEN 'hit'
                                    WHEN choice = 'under' THEN 'missed'
                                END
                                WHERE prop_id = %s AND choice IN ('over', 'under')
                                RETURNING id, parlay_id
                            )
                            SELECT id, parlay_id FROM updates
                        """

                        cur.execute(batch_update_stmt, (updated_prop["id"],))
                        batch_res_list = cur.fetchall()

                        for res in batch_res_list:
                            picks_to_invalidate.append({"id": res[0], "parlay_id": res[1]})

                    elif updated_prop["current_value"] == updated_prop["line"]:
                        ties_update_stmt = """
                            UPDATE pick SET status = 'tie'
                            WHERE prop_id = %s
                            RETURNING id, parlay_id
                        """

                        cur.execute(ties_update_stmt, (updated_prop["id"],))
                        ties_res_list = cur.fetchall()

                        for ties_res in ties_res_list:
                            picks_to_invalidate.append(
                                {"id": ties_res[0], "parlay_id": ties_res[1]}
                            )
                    else:
                        batch_update_stmt = """
                            WITH updates AS (
                                UPDATE pick SET status = CASE
                                    WHEN choice = 'over' THEN 'missed'
                                    WHEN choice = 'under' THEN 'hit'
                                END
                                WHERE prop_id = %s AND choice IN ('over', 'under')
                                RETURNING id, parlay_id
                            )
                            SELECT id, parlay_id FROM updates
                        """

                        cur.execute(batch_update_stmt, (updated_prop["id"],))
                        batch_res_list = cur.fetchall()

                        for res in batch_res_list:
                            picks_to_invalidate.append({"id": res[0], "parlay_id": res[1]})

                else:
                    if updated_prop["current_value"] > updated_prop["line"]:
                        batch_update_stmt = """
                            WITH updates AS (
                                UPDATE pick SET status = CASE
                                    WHEN choice = 'over' THEN 'hit'
                                    WHEN choice = 'under' THEN 'missed'
                                END
                                WHERE prop_id = %s AND choice IN ('over', 'under')
                                RETURNING id, parlay_id
                            )
                            SELECT id, parlay_id FROM updates
                        """

                        cur.execute(batch_update_stmt, (updated_prop["id"],))
                        batch_res_list = cur.fetchall()

                        for res in batch_res_list:
                            picks_to_invalidate.append({"id": res[0], "parlay_id": res[1]})
                    else:
                        related_picks_query = """
                            SELECT id, parlay_id
                            FROM pick
                            WHERE prop_id = %s
                        """

                        cur.execute(related_picks_query, (updated_prop["id"],))
                        related_picks_res_list = cur.fetchall()

                        for related_picks_res in related_picks_res_list:
                            picks_to_invalidate.append(
                                {"id": related_picks_res[0], "parlay_id": related_picks_res[1]}
                            )

                cur.execute("COMMIT")

            except Exception as e:
                cur.execute("ROLLBACK")
                logger.error(f"Database transaction failed: {e}")
                raise e

    try:
        for pick in picks_to_invalidate:
            redis_publisher.publish(
                channel="pick_resolved", message=json.dumps({"id": pick["id"]})
            )
            redis_publisher.publish(
                channel="invalidate_queries",
                message=json.dumps(
                    {"keys": [["pick", pick["id"]], ["parlay", pick["parlay_id"]]]}
                ),
            )
    finally:
        redis_publisher.close()


def listen_for_prop_updated():
    """Function that listens for a prop updated message on the redis server"""
    # Create dedicated Redis connection for listener
    redis_subscriber = create_redis_client()

    try:
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=PICKS_UPDATER_MAX_WORKERS
        ) as executor:

            def async_handler(data):
                executor.submit(handle_prop_updated, data)

            logger.info("Listening for prop updated messages...")
            listen_for_messages(redis_subscriber, "prop_updated", async_handler)
    finally:
        redis_subscriber.close()


def main():
    """Main function that listens for prop updated messages."""
    try:
        listen_for_prop_updated()
    except KeyboardInterrupt:
        logger.warning("Shutting down update_parlay_picks...")
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main()
