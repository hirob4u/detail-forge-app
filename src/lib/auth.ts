import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : [],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        // Dynamic imports to avoid pulling email/React-Email into middleware bundle
        const { render } = await import("@react-email/components");
        const { default: PasswordResetEmail } = await import(
          "@/lib/email-templates/password-reset"
        );
        const { getResend, DEFAULT_FROM } = await import("@/lib/email");

        const html = await render(
          PasswordResetEmail({
            resetUrl: url,
            userName: user.name,
          }),
        );
        // Fire-and-forget to prevent timing attacks (email enumeration)
        getResend()
          .emails.send({
            from: DEFAULT_FROM,
            to: user.email,
            subject: "Reset your DetailForge password",
            html,
          })
          .catch((err) => {
            console.error("Failed to send password reset email:", err);
          });
      } catch (err) {
        console.error("Failed to render password reset email:", err);
      }
    },
  },
  plugins: [organization()],
});
