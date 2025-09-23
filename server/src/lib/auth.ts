import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db";
import { resend } from "../resend";

export const auth = betterAuth({
  plugins: [
    username({
      usernameNormalization: false,
      minUsernameLength: 1,
      maxUsernameLength: 16,
    }),
    expo(),
  ],
  trustedOrigins: ["riskleague://", "riskleague://reset-password"],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Risk League <noreply@auth.riskleague.app>",
        to: user.email,
        subject: "Password Reset from Risk League",
        html: `
          <p>Click the link to reset your password: <a href="${url}">${url}</a>.</p>
        `,
      });
    },
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
    },
  },
});
