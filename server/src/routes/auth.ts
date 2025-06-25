import bycrpt from "bcrypt";
import { NextFunction, Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/db";
import { createSession } from "../utils/createSession";
import { assertRequiredFields } from "../utils/validateFields";
import { RegisterBody, SignInBody, TokenPayload } from "../types/auth";
import { MissingFieldsError } from "../types/MissingFieldsError";

export const authRoute = Router();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Authenticating...");
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
    console.log("Token verification failed:", (<Error>err).message);
    res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid Access Token" });
    return;
  }
};

authRoute.get("/auth/session", authMiddleware, async (_, res) => {
  const userId = res.locals.userId;

  const user = await db
    .selectFrom("users")
    .select(["id", "email", "username", "image", "elo_rating"])
    .where("id", "=", userId)
    .executeTakeFirst();

  if (!user) {
    res.status(404).json({
      error: "Not Found",
      message: "No user was found",
    });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      image: user.image,
    },
  });
});

authRoute.post("/auth/signup", async (req, res) => {
  const body: RegisterBody = req.body;
  console.log(body);

  try {
    assertRequiredFields(body, ["name", "username", "email", "password"]);

    const { name, username, email, password } = body;

    const sameEmail = await db
      .selectFrom("users")
      .select("email")
      .where("email", "=", email)
      .executeTakeFirst();
    if (sameEmail) {
      res.status(409).json({
        error: "Conflict",
        message: "Sign up email is already in use",
      });
      return;
    }

    const sameUsername = await db
      .selectFrom("users")
      .select("username")
      .where("username", "=", username)
      .executeTakeFirst();
    if (sameUsername) {
      res.status(409).json({
        error: "Conflict",
        message: "Sign up username is already in use",
      });
      return;
    }

    const encryptedPassword = await bycrpt.hash(password, 10);

    const user = await db
      .insertInto("users")
      .values({
        name,
        username,
        email,
        password_hash: encryptedPassword,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

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

    const user = await db
      .selectFrom("users")
      .select(["id", "password_hash"])
      .where("email", "=", email)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "No user was found with those credentials",
      });
      return;
    }

    const isPasswordCorrect = await bycrpt.compare(
      password,
      user.password_hash
    );

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
