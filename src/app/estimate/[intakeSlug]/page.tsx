import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import IntakeForm from "./intake-form";

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
  const fontUrl =
    org.nameFont && org.nameFont !== "DM Sans" && org.nameFont !== "JetBrains Mono"
      ? GOOGLE_FONTS_URLS[org.nameFont]
      : null;

  return (
    <div
      style={
        {
          "--color-brand": org.accentColor ?? "#7C4DFF",
          "--color-brand-hover": `color-mix(in srgb, ${org.accentColor ?? "#7C4DFF"}, black 15%)`,
        } as React.CSSProperties
      }
      className="min-h-screen bg-[var(--color-background)]"
    >
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Branded header -- left aligned logo + shop name lockup */}
          <header className="mb-8 py-8">
            <div className="flex items-center gap-3">
              {org.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logoUrl}
                  alt={displayName}
                  className="h-12 w-auto object-contain"
                />
              )}
              <span
                className="text-xl font-semibold"
                style={{
                  color: `var(--color-brand, #7C4DFF)`,
                  fontFamily: org.nameFont
                    ? `'${org.nameFont}', sans-serif`
                    : "inherit",
                }}
              >
                {displayName}
              </span>
            </div>
            {org.shopTagline && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {org.shopTagline}
              </p>
            )}
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Request a detailing estimate
            </p>
          </header>

          <IntakeForm orgSlug={org.slug} orgName={displayName} />
        </div>

        {/* Powered by badge */}
        <footer className="py-6 text-center">
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
    </div>
  );
}
