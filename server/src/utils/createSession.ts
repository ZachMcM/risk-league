import jwt from "jsonwebtoken";

export async function createSession(user: { id: number }): Promise<string> {
  const payload = {
    userId: user.id,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "365 days",
  });

  return accessToken;
}
