import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { colors } from "@/lib/design-tokens";
import { CircleCheck } from "lucide-react";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ intakeSlug: string }>;
}) {
  const { intakeSlug } = await params;

  const [org] = await db
    .select({
      name: organizations.name,
      website: organizations.website,
      accentColor: organizations.accentColor,
    })
    .from(organizations)
    .where(eq(organizations.slug, intakeSlug))
    .limit(1);

  if (!org) {
    notFound();
  }

  const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const brandColor =
    org.accentColor && HEX_COLOR_RE.test(org.accentColor)
      ? org.accentColor
      : colors.purpleAction;

  return (
    <div
      style={{
        "--color-brand": brandColor,
        "--color-brand-hover": `color-mix(in srgb, ${brandColor}, black 15%)`,
      } as React.CSSProperties}
      className="flex min-h-dvh items-center justify-center bg-[var(--color-background)] px-4"
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-elevated)]">
          <CircleCheck className="h-8 w-8 text-[var(--color-green)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Request Submitted
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Thank you! {org.name} has received your estimate request and will
          be in touch soon.
        </p>
        {/* Trust model: org admins control their own website URL.
            Protocol-validated to prevent javascript: injection. */}
        {org.website && /^https?:\/\//.test(org.website) && (
          <a
            href={org.website}
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-[var(--radius-button)] bg-[var(--color-brand)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            Visit {org.name}
          </a>
        )}
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          You can safely close this page.
        </p>
      </div>
    </div>
  );
}
