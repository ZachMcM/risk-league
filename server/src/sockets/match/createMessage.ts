import { eq } from "drizzle-orm";
import { db } from "../../drizzle";
import { matchMessages } from "../../drizzle/schema";
import { logger } from "../../logger";

export async function createMessage(
  content: string,
  userId: number,
  matchId: number
) {
  logger.info("Message recieved", { messageContent: content });
  // Insert message into database
  const [newMessage] = await db
    .insert(matchMessages)
    .values({
      userId: userId,
      matchId: matchId,
      content,
    })
    .returning({ id: matchMessages.id });

  // Get user info for the message
  const message = await db.query.matchMessages.findFirst({
    where: eq(matchMessages.id, newMessage.id),
    columns: {
      content: true,
      createdAt: true,
      id: true,
      userId: true,
      matchId: true
    },
    with: {
      user: {
        columns: {
          username: true,
          id: true,
          image: true,
          eloRating: true
        },
      },
    },
  });

  return message;
}
