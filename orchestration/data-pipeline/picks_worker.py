from utils import setup_logger, server_req, getenv_required
from redis_utils import listen_for_messages, create_redis_client
import concurrent.futures
from db.connection import get_connection_context
import json

logger = setup_logger(__name__)

redis_client = create_redis_client()

PICKS_UPDATER_MAX_WORKERS = int(getenv_required("PICKS_UPDATER_MAX_WORKERS"))


def handle_prop_updated(data):
    """Handle incoming prop_updated messages"""
    prop_id = data.get("id")
    if not prop_id:
        logger.error("Received prop updated message without id")
        return

    picks_to_invalidate = []

    with get_connection_context() as conn:
        with conn.cursor() as cur:
            select_query = """
                SELECT id, current_value, line, status
                FROM prop
                WHERE id = %s
            """

            cur.execute(select_query, (prop_id))
            prop_query_res = cur.fetchone()

            if not prop_query_res:
                logger.warning("Error, no prop found")
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

                cur.execute(update_stmt, (updated_prop["id"]))
                res = cur.fetchone()
                if not res:
                    logger.warning("Error, failed to update pick")
                    return

                picks_to_invalidate.append({"id": res[0], "parlay_id": res[1]})

            elif updated_prop["status"] == "resolved":
                if updated_prop["current_value"] > updated_prop["line"]:
                    hits_update_stmt = """
                        UPDATE pick SET status = 'hit'
                        WHERE choice = 'over' AND prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(hits_update_stmt, (updated_prop["id"]))
                    hits_res = cur.fetchone()

                    if not hits_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": hits_res[0], "parlay_id": hits_res[1]}
                    )

                    misses_update_stmt = """
                        UPDATE pick SET status = 'missed'
                        WHERE choice = 'under' AND prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(misses_update_stmt, (updated_prop["id"]))
                    misses_res = cur.fetchone()

                    if not misses_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": misses_res[0], "parlay_id": misses_res[1]}
                    )

                elif updated_prop["current_value"] == updated_prop["line"]:
                    ties_update_stmt = """
                        UPDATE pick SET status = 'tie'
                        WHERE prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(ties_update_stmt, (updated_prop["id"]))
                    ties_res = cur.fetchone()

                    if not ties_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": ties_res[0], "parlay_id": ties_res[1]}
                    )
                else:
                    misses_update_stmt = """
                        UPDATE pick SET status = 'missed'
                        WHERE choice = 'over' AND prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(misses_update_stmt, (updated_prop["id"]))
                    misses_res = cur.fetchone()

                    if not misses_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": misses_res[0], "parlay_id": misses_res[1]}
                    )

                    hits_update_stmt = """
                        UPDATE pick SET status = 'hit'
                        WHERE choice = 'under' AND prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(hits_update_stmt, (updated_prop["id"]))
                    hits_res = cur.fetchone()

                    if not hits_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": hits_res[0], "parlay_id": hits_res[1]}
                    )
            else:
                if updated_prop["current_value"] > updated_prop["line"]:
                    hits_update_stmt = """
                        UPDATE pick SET status = 'hit'
                        WHERE choice = 'over' AND prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(hits_update_stmt, (updated_prop["id"]))
                    hits_res = cur.fetchone()

                    if not hits_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": hits_res[0], "parlay_id": hits_res[1]}
                    )

                    misses_update_stmt = """
                        UPDATE pick SET status = 'missed'
                        WHERE choice = 'under' AND prop_id = %s
                        RETURNING id, parlay_id
                    """

                    cur.execute(misses_update_stmt, (updated_prop["id"]))
                    misses_res = cur.fetchone()

                    if not misses_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": misses_res[0], "parlay_id": misses_res[1]}
                    )
                else:
                    related_picks_query = """
                        SELECT id, parlay_id 
                        FROM pick
                        WHERE prop_id = %s
                    """

                    cur.execute(related_picks_query, (updated_prop["id"]))
                    related_picks_res = cur.fetchone()

                    if not related_picks_res:
                        logger.warning("Error, failed to update pick")
                        return

                    picks_to_invalidate.append(
                        {"id": related_picks_res[0], "parlay_id": related_picks_res[1]}
                    )

    for pick in picks_to_invalidate:
        redis_client.publish(
            channel="pick_resolved", message=json.dumps({"id": pick["id"]})
        )
        
        # TODO send invalidation message


def listen_for_prop_updated():
    """Function that listens for a prop updated message on the redis server"""
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=PICKS_UPDATER_MAX_WORKERS
    ) as executor:

        def async_handler(data):
            executor.submit(handle_prop_updated, data)

        logger.info("Listening for prop updated messages...")
        listen_for_messages(redis_client, "prop_updated", async_handler)


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
