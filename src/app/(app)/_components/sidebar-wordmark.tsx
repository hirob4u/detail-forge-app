import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDetailForgeOrg } from "@/lib/org";

export default async function SidebarWordmark() {
  const session = await auth.api.getSession({ headers: await headers() });
  const betterAuthOrgId = session?.session.activeOrganizationId;

  const org = await getDetailForgeOrg(betterAuthOrgId);

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
