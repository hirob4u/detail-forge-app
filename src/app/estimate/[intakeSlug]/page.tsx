import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import IntakeForm from "./intake-form";

// Design tokens imported for inline styles. Tailwind classes reference the
// equivalent CSS custom properties (e.g. var(--color-background)) because
// Tailwind's static extractor cannot resolve JS template interpolations.
// Both sources resolve to the same hex values defined in globals.css.
import { colors } from "@/lib/design-tokens";

const GOOGLE_FONTS_URLS: Record<string, string> = {
  Inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
  Syne: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap",
  Barlow:
    "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap",
  Oswald:
    "https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap",
  "Bebas Neue":
    "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
  Montserrat:
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap",
};

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ intakeSlug: string }>;
}) {
  const { intakeSlug } = await params;

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      shopName: organizations.shopName,
      shopTagline: organizations.shopTagline,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
    })
    .from(organizations)
    .where(eq(organizations.slug, intakeSlug))
    .limit(1);

  if (!org) {
    notFound();
  }

  const displayName = org.shopName ?? org.name;
  const brandColor = org.accentColor ?? colors.purpleAction;

  const fontUrl =
    org.nameFont &&
    org.nameFont !== "DM Sans" &&
    org.nameFont !== "JetBrains Mono"
      ? GOOGLE_FONTS_URLS[org.nameFont]
      : null;

  return (
    <div
      style={
        {
          "--color-brand": brandColor,
          "--color-brand-hover": `color-mix(in srgb, ${brandColor}, black 15%)`,
        } as React.CSSProperties
      }
      className="min-h-dvh flex flex-col bg-[var(--color-background)]"
    >
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      <main className="flex-1 w-full max-w-2xl mx-auto px-0 sm:px-8 py-6 sm:py-16">
        {/* Identity region */}
        <header className="mb-0 px-4 sm:px-0">
          {/* Logo + shop name lockup */}
          <div className="flex items-center gap-4 mb-3">
            {org.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={displayName}
                className="h-14 w-auto max-w-[160px] object-contain flex-shrink-0 sm:h-20 sm:max-w-[200px]"
              />
            )}
            <span
              className="text-2xl sm:text-3xl font-semibold leading-tight text-[var(--color-text)]"
              style={{
                fontFamily: org.nameFont
                  ? `'${org.nameFont}', sans-serif`
                  : "inherit",
              }}
            >
              {displayName}
            </span>
          </div>

          {/* Tagline */}
          {org.shopTagline && (
            <p className="text-base text-[var(--color-muted)] mb-1">
              {org.shopTagline}
            </p>
          )}

          {/* Page intent label */}
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted)] opacity-60 mb-6">
            Request a detailing estimate
          </p>

          {/* Accent bar + divider */}
          <div
            className="h-0.5 w-10 mb-px"
            style={{ backgroundColor: brandColor }}
          />
          <hr className="border-[var(--color-border)]" />
        </header>

        {/* Form card */}
        <section className="mt-8 sm:mt-10 px-4 py-6 sm:rounded-[var(--radius-card)] sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-elevated)] sm:px-6 sm:py-8">
          <p
            className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-6"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Vehicle &amp; contact details
          </p>
          <IntakeForm orgSlug={org.slug} orgName={displayName} />
        </section>
      </main>

      {/* Powered by footer */}
      <footer className="py-5 text-center">
        <a
          href="https://detailforge.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] opacity-50 transition-opacity hover:opacity-80"
        >
          <span>Powered by</span>
          <span className="font-semibold text-[var(--color-text)]">
            DetailForge.io
          </span>
        </a>
      </footer>
    </div>
  );
}
