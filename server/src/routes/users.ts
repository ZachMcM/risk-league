import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { user } from "../db/schema";
import { authMiddleware } from "../middleware";

export const usersRoute = Router();

usersRoute.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    const userResult = await db.query.user.findFirst({
      columns: {
        id: true,
        username: true,
        image: true,
        points: true,
        header: true,
        peakPoints: true,
      },
      where: eq(user.id, res.locals.userId!),
    });

    if (!userResult) {
      res.status(404).json({
        error: "No user was found",
      });
      return;
    }

    res.json(userResult);
  } catch (err) {
    res.status(404).json({
      error: "No user was found",
    });
  }
});
