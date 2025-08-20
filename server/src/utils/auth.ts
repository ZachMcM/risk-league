import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db";

export const auth = betterAuth({
  plugins: [
    username({
      usernameNormalization: false,
      minUsernameLength: 1,
      maxUsernameLength: 16,
    }),
    expo(),
  ],
  trustedOrigins: ["riskleague://*"],
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    expiresIn: 365 * 24 * 60 * 60, // one year
  },
  user: {
    additionalFields: {
      points: {
        type: "number",
        input: false,
        required: false,
      },
      header: {
        type: "string",
        input: false,
        required: false,
      },
    },
  },
});
