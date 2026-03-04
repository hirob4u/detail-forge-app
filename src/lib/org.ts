import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolves a Better Auth organization ID (nanoid) to the DetailForge
 * organizations table UUID. All app data (jobs, customers, vehicles)
 * is keyed to the DetailForge UUID -- never to the Better Auth ID.
 *
 * Returns null if no matching organization is found.
 */
export async function getDetailForgeOrgId(
  betterAuthOrgId: string | null | undefined,
): Promise<string | null> {
  if (!betterAuthOrgId) return null;

  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.betterAuthOrgId, betterAuthOrgId))
    .limit(1);

  return org?.id ?? null;
}

/**
 * Resolves a Better Auth organization ID to the full DetailForge
 * organization record. Use when branding or profile fields are needed.
 */
export async function getDetailForgeOrg(
  betterAuthOrgId: string | null | undefined,
) {
  if (!betterAuthOrgId) return null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.betterAuthOrgId, betterAuthOrgId))
    .limit(1);

  return org ?? null;
}
