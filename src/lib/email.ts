import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Returns the Resend client, lazily initialized on first use.
 * Throws at send time (not import time) if RESEND_API_KEY is missing,
 * so the app runs fine without email configured.
 */
export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY environment variable is required to send emails. " +
          "Add it to .env.local or configure it in Vercel.",
      );
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Default "from" address for all DetailForge emails.
 * Uses Resend's shared domain for development; switch to a custom domain
 * (e.g. noreply@detailforge.io) once DNS is configured.
 */
export const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL ?? "DetailForge <onboarding@resend.dev>";
