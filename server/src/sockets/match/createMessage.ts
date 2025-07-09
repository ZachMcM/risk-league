import { db } from "../../db/db";
import { logger } from "../../logger";

export async function createMessage(
  content: string,
  userId: string,
  matchId: string
) {
  logger.info("Message recieved", { messageContent: content })
  // Insert message into database
  const newMessage = await db
    .insertInto("match_messages")
    .values({
      user_id: userId,
      match_id: matchId,
      content,
    })
    .returning(["id", "created_at"])
    .executeTakeFirstOrThrow();

  // Get user info for the message
  const user = await db
    .selectFrom("users")
    .select(["username", "image"])
    .where("id", "=", userId)
    .executeTakeFirstOrThrow();

  const messageData = {
    id: newMessage.id,
    userId,
    username: user.username,
    image: user.image,
    content,
    createdAt: newMessage.created_at,
  };

  return messageData;
}
