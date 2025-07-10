import bycrpt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../drizzle";
import { users } from "../drizzle/schema";
import { logger } from "../logger";
import { RegisterBody, SignInBody, TokenPayload } from "../types/auth";
import { MissingFieldsError } from "../types/MissingFieldsError";
import { createSession } from "../utils/createSession";
import { assertRequiredFields } from "../utils/validateFields";

export const authRoute = Router();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.header("Access-Token");

  if (!accessToken) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: "No Access Token provided" });
    return;
  }

  try {
    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.JWT_SECRET!
    ) as TokenPayload;
    res.locals.userId = decodedAccessToken.userId;
    next();
  } catch (err) {
    logger.error("Token verification failed:", (<Error>err).message);
    res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid Access Token" });
    return;
  }
};

authRoute.get("/auth/session", authMiddleware, async (_, res) => {
  const userId = parseInt(res.locals.userId);

  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      username: true,
      image: true,
      eloRating: true,
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
});

authRoute.post("/auth/signup", async (req, res) => {
  const body: RegisterBody = req.body;

  try {
    assertRequiredFields(body, ["name", "username", "email", "password"]);

    const { name, username, email, password } = body;

    const sameEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (sameEmail) {
      res.status(409).json({
        error: "Conflict",
        message: "Sign up email is already in use",
      });
      return;
    }

    const sameUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (sameUsername) {
      res.status(409).json({
        error: "Conflict",
        message: "Sign up username is already in use",
      });
      return;
    }

    const encryptedPassword = await bycrpt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        name,
        username,
        email,
        passwordHash: encryptedPassword,
      })
      .returning({ id: users.id });

    const accessToken = await createSession(user);

    res.header("Access-Token", accessToken).json(user);
    return;
  } catch (err) {
    if (err instanceof MissingFieldsError) {
      res.status(err.status).json({
        error: err.message,
        message: `${err.missing} missing`,
      });
    } else {
      res.status(500).json({ error: "Unexpected error", message: err });
    }
    return;
  }
});

authRoute.post("/auth/signin", async (req, res) => {
  const body: SignInBody = req.body;

  try {
    assertRequiredFields(body, ["password", "email"]);

    const { password, email } = body;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "No user was found with those credentials",
      });
      return;
    }

    const isPasswordCorrect = await bycrpt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Incorrect password",
      });
      return;
    }

    const accessToken = await createSession({ id: user.id });
    res.header("Access-Token", accessToken).json({
      id: user.id,
    });
    return;
  } catch (err) {
    if (err instanceof MissingFieldsError) {
      res.status(err.status).json({
        error: err.message,
        message: `${err.missing} missing`,
      });
    } else {
      res.status(500).json({ error: "Unexpected error" });
    }
    return;
  }
});
