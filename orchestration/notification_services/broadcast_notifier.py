from utils import setup_logger, async_server_req
from db.connection import get_async_pool, close_async_pool
import asyncio

logger = setup_logger(__name__)


async def send_broadcast_notification(title: str, body: str, url: str | None = None):
    """Send a broadcast notification to all users"""
    logger.info(f"Preparing to send broadcast notification: {title}")

    pool = await get_async_pool()

    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
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

                # Send notification to all users via HTTP
                await async_server_req(
                    route="/push-notifications",
                    method="POST",
                    body={
                        "receiverIdsList": user_ids,
                        "pushNotification": {
                            "title": title,
                            "body": body,
                            "data": {
                                "url": url
                            }
                        },
                    },
                )

                logger.info(f"Successfully sent notification to {len(user_ids)} recipients")

    except Exception as e:
        logger.error(f"Error sending broadcast notification: {e}")
        raise


async def main():
    """Main function that prompts for input and sends broadcast notification"""
    try:
        # Prompt for notification details
        print("\n=== Broadcast Notification Tool ===\n")

        title = input("Enter notification title: ").strip()
        if not title:
            print("Error: Title cannot be empty")
            return

        body = input("Enter notification body: ").strip()
        if not body:
            print("Error: Body cannot be empty")
            return

        url = input("Enter notification URL (press Enter for default 'None'): ").strip()
        if not url:
            url = None

        # Confirm before sending
        print(f"\n--- Notification Preview ---")
        print(f"Title: {title}")
        print(f"Body: {body}")
        print(f"URL: {url}")
        print(f"----------------------------\n")

        confirm = input("Send this notification to all users? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y']:
            print("Notification cancelled")
            return

        await send_broadcast_notification(title, body, url)
        print("\nNotification sent successfully!")

    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
    except Exception as e:
        logger.error(f"Error in main: {e}")
        raise
    finally:
        await close_async_pool()


if __name__ == "__main__":
    asyncio.run(main())
