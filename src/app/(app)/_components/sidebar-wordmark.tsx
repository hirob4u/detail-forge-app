import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export default async function SidebarWordmark() {
  const session = await auth.api.getSession({ headers: await headers() });
  const orgId = session?.session.activeOrganizationId;

  if (!orgId) {
    return (
      <span className="text-xl font-bold text-[var(--color-purple-text)]">
        DetailForge
      </span>
    );
  }

  const [org] = await db
    .select({
      logoUrl: organizations.logoUrl,
      shopName: organizations.shopName,
      name: organizations.name,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (org?.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={org.logoUrl}
        alt={org.shopName ?? "Logo"}
        className="h-8 w-auto object-contain"
      />
    );
  }

  return (
    <span className="text-xl font-bold text-[var(--color-purple-text)]">
      DetailForge
    </span>
  );
}
