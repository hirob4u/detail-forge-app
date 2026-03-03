import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seedPrompt() {
  const fs = await import("fs");
  const path = await import("path");
  const { db } = await import("../src/lib/db");
  const { prompts } = await import("../src/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const PROMPT_CONTENT = fs.readFileSync(
    path.join(process.cwd(), "scripts", "prompt-content.txt"),
    "utf-8",
  );

  console.log("Seeding condition assessment prompt...");

  // Deactivate any existing versions
  await db
    .update(prompts)
    .set({ active: false })
    .where(eq(prompts.name, "condition-assessment"));

  // Insert new active version
  const existing = await db
    .select({ version: prompts.version })
    .from(prompts)
    .where(eq(prompts.name, "condition-assessment"))
    .orderBy(prompts.version);

  const nextVersion =
    existing.length > 0
      ? Math.max(...existing.map((r) => r.version)) + 1
      : 1;

  const [inserted] = await db
    .insert(prompts)
    .values({
      name: "condition-assessment",
      version: nextVersion,
      content: PROMPT_CONTENT,
      active: true,
    })
    .returning();

  console.log(
    `Prompt seeded. ID: ${inserted.id} -- Version: ${inserted.version}`,
  );
  process.exit(0);
}

seedPrompt().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
