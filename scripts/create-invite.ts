import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: ".env.local" });

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

async function createInvite(options: {
  email?: string;
  note?: string;
  count?: number;
}) {
  const { db } = await import("../src/lib/db");
  const { invites } = await import("../src/lib/db/schema");

  const count = options.count ?? 1;
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    await db.insert(invites).values({
      code,
      email: options.email ?? null,
      createdByNote: options.note ?? null,
    });
    codes.push(code);
  }

  console.log(`Created ${count} invite code(s):`);
  codes.forEach((code) => console.log(`  ${code}`));
}

const args = process.argv.slice(2);
const email = args.find((a) => a.startsWith("--email="))?.split("=")[1];
const note = args.find((a) => a.startsWith("--note="))?.split("=")[1];
const count = parseInt(
  args.find((a) => a.startsWith("--count="))?.split("=")[1] ?? "1",
);

createInvite({ email, note, count })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
