import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../drizzle";
import { users } from "../drizzle/schema";
import { authMiddleware } from "./auth";

export const usersRoute = Router();

usersRoute.get("/users/:id", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await db.query.users.findFirst({
      columns: {
        id: true,
        username: true,
        image: true,
        eloRating: true,
        header: true
      },
      where: eq(users.id, userId),
    });

    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "No user was found",
      });
      return;
    }

    res.json(user);
  } catch (err) {
    res.status(404).json({
      error: "Not Found",
      message: "No user was found",
    });
  }
});
