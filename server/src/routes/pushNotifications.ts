import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { db } from "../db";
import { user } from "../db/schema";
import { inArray } from "drizzle-orm";
import { logger } from "../logger";
import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import * as z from "zod";

const expo = new Expo();

interface PushNotificationPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends push notifications to multiple users
 */
export async function sendPushNotifications({
  userIds,
  title,
  body,
  data = {},
}: PushNotificationPayload): Promise<void> {
  try {
    // Get push tokens for all users
    const users = await db.query.user.findMany({
      where: inArray(user.id, userIds),
      columns: {
        id: true,
        expoPushToken: true,
      },
    });

    // Filter out users without push tokens and validate tokens
    const messages: ExpoPushMessage[] = [];
    for (const u of users) {
      if (!u.expoPushToken) {
        continue;
      }

      // Check that the token is valid
      if (!Expo.isExpoPushToken(u.expoPushToken)) {
        logger.warn(
          `Invalid Expo push token for user ${u.id}: ${u.expoPushToken}`
        );
        continue;
      }

      messages.push({
        to: u.expoPushToken,
        sound: "default",
        title,
        body,
        data,
      });
    }

    // No messages to send
    if (messages.length === 0) {
      return;
    }

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error("Error sending push notification chunk:", error);
      }
    }

    // Handle tickets with errors
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === "error") {
        logger.error(
          `Push notification error for message ${i}:`,
          ticket.message,
          ticket.details
        );
      }
    }
  } catch (error) {
    logger.error("Error in sendPushNotifications:", error);
  }
}

/**
 * Helper to send notification to a single user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await sendPushNotifications({
    userIds: [userId],
    title,
    body,
    data,
  });
}

export const pushNotificationsRoute = Router();

const pushNotificationReqBodySchema = z.object({
  receiverIdsList: z.string().array(),
  pushNotification: z.object({
    title: z.string(),
    body: z.string(),
    data: z.any(),
  }),
});

type PushNotificationReqBody = z.infer<typeof pushNotificationReqBodySchema>;

pushNotificationsRoute.post(
  "/push-notifications",
  apiKeyMiddleware,
  async (req, res) => {
    try {
      const reqBody = req.body as PushNotificationReqBody;

      pushNotificationReqBodySchema.parse(reqBody);

      const {
        receiverIdsList: userIds,
        pushNotification: { title, body, data },
      } = reqBody;

      await sendPushNotifications({
        userIds,
        title,
        data,
        body,
      });

      res.json({ success: true })
    } catch (error) {
      handleError(error, res, "Push Notifications");
    }
  }
);
