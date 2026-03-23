/**
 * Send an invite email to a prospective user.
 *
 * Creates an invite code (locked to the given email) and sends an email
 * with a sign-up link via Resend.
 *
 * Usage:
 *   npm run send-invite -- --email=user@example.com
 *   npm run send-invite -- --email=user@example.com --note="Requested via email"
 *
 * Required env vars (loaded from .env.local):
 *   DATABASE_URL — Neon connection string
 *   RESEND_API_KEY — Resend API key
 *   NEXT_PUBLIC_APP_URL — App base URL (defaults to https://detailforge.io)
 */

import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: ".env.local" });

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://detailforge.io";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(0, chars.length)],
  ).join("");
  const part2 = Array.from({ length: 4 }, () =>
    chars[crypto.randomInt(0, chars.length)],
  ).join("");
  return `${part1}-${part2}`;
}

/** Parse a CLI arg like --key=value, preserving the full value after the first `=`. */
function parseArg(args: string[], prefix: string): string | undefined {
  const arg = args.find((a) => a.startsWith(prefix));
  if (!arg) return undefined;
  const idx = arg.indexOf("=");
  return idx === -1 ? undefined : arg.substring(idx + 1);
}

async function sendInvite(options: { email: string; note?: string }) {
  // Dynamic imports to avoid bundling issues (see forge pattern: auth.ts static imports)
  const { db } = await import("../src/lib/db");
  const { invites } = await import("../src/lib/db/schema");
  const { getResend, DEFAULT_FROM } = await import("../src/lib/email");
  const { render } = await import("@react-email/components");
  const { default: InviteEmail } = await import(
    "../src/lib/email-templates/invite"
  );

  // 1. Create invite code locked to this email (retry once on unlikely collision)
  let code = generateCode();
  try {
    await db.insert(invites).values({
      code,
      email: options.email,
      createdByNote: options.note ?? "Sent via send-invite script",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      console.warn("Code collision, retrying with a new code...");
      code = generateCode();
      await db.insert(invites).values({
        code,
        email: options.email,
        createdByNote: options.note ?? "Sent via send-invite script",
      });
    } else {
      throw err;
    }
  }

  console.log(`Created invite code: ${code}`);

  // 2. Build sign-up URL with code pre-filled
  const signUpUrl = `${APP_URL}/sign-up?code=${encodeURIComponent(code)}`;

  // 3. Render email template
  const html = await render(
    InviteEmail({ signUpUrl, inviteCode: code }),
  );

  // 4. Send via Resend
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to: options.email,
    subject: "You're invited to DetailForge",
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    process.exit(1);
  }

  console.log(`Invite email sent to ${options.email}`);
  console.log(`  Sign-up link: ${signUpUrl}`);
  console.log(`  Resend ID: ${data?.id}`);
}

// --- CLI argument parsing ---

const args = process.argv.slice(2);
const email = parseArg(args, "--email=");
const note = parseArg(args, "--note=");

if (!email || !EMAIL_RE.test(email)) {
  console.error(
    !email
      ? "Usage: npm run send-invite -- --email=user@example.com [--note=\"...\"]"
      : `Invalid email address: ${email}`,
  );
  process.exit(1);
}

sendInvite({ email, note })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
