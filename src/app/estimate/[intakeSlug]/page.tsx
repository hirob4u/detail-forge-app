import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import IntakeForm from "./intake-form";

const GOOGLE_FONTS_URLS: Record<string, string> = {
  Inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
  "Space Grotesk":
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
  Syne: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap",
  Barlow:
    "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap",
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
          {/* Branded header */}
          <header className="mb-8 py-8 text-center">
            {org.logoUrl ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={org.logoUrl}
                  alt={displayName}
                  className="h-16 w-auto object-contain"
                />
                {org.shopTagline && (
                  <p className="text-sm text-[var(--color-muted)]">
                    {org.shopTagline}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p
                  className="text-2xl font-bold text-[var(--color-text)]"
                  style={{
                    fontFamily: org.nameFont
                      ? `"${org.nameFont}", sans-serif`
                      : "inherit",
                  }}
                >
                  {displayName}
                </p>
                {org.shopTagline && (
                  <p className="text-sm text-[var(--color-muted)]">
                    {org.shopTagline}
                  </p>
                )}
              </div>
            )}
            <p className="mt-2 text-sm text-[var(--color-muted)]">
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
