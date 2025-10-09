import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db";
import { resend } from "../resend";
import { emailOTP } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Clear push token when user signs out
      if (ctx.path === "/sign-out") {
        const userId = ctx.context.session?.user?.id;
        if (userId) {
          await db
            .update(user)
            .set({ expoPushToken: null })
            .where(eq(user.id, userId));
        }
      }
    }),
  },
  plugins: [
    username({
      usernameNormalization: false,
      minUsernameLength: 1,
      maxUsernameLength: 16,
    }),
    expo(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type == "forget-password") {
          await resend.emails.send({
            from: "Risk League <noreply@info.riskleague.app>",
            to: email,
            subject: "Risk League Reset Password",
            html: `This is your one time password: ${otp}. Do not share it with anyone`,
          });
        }
      },
    }),
  ],
  trustedOrigins: ["riskleague://", "riskleague://reset-password"],
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
      banner: {
        type: "string",
        input: false,
        required: false,
      },
      expoPushToken: {
        type: "string",
        input: false,
        required: false,
      },
    },
  },
});
