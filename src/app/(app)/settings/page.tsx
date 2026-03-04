import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import BrandingForm from "./branding-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const betterAuthOrgId = session.session.activeOrganizationId;
  const orgId = await getDetailForgeOrgId(betterAuthOrgId);
  if (!orgId) {
    redirect("/dashboard");
  }

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      businessEmail: organizations.businessEmail,
      phone: organizations.phone,
      website: organizations.website,
      city: organizations.city,
      state: organizations.state,
      shopName: organizations.shopName,
      shopTagline: organizations.shopTagline,
      logoKey: organizations.logoKey,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Settings
        </h1>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
          Organization profile and customer-facing branding
        </p>
      </div>

      <BrandingForm org={org} />
    </div>
  );
}
