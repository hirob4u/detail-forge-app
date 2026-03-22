import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, organizations } from "@/lib/db/schema";
import { colors } from "@/lib/design-tokens";
import { FONT_VARIABLES } from "@/lib/fonts";
import { CheckCircle2 } from "lucide-react";
import Wordmark from "@/components/wordmark";

export default async function QuoteApprovedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [job] = await db
    .select({
      id: jobs.id,
      orgId: jobs.orgId,
    })
    .from(jobs)
    .where(eq(jobs.quoteToken, token))
    .limit(1);

  if (!job) {
    notFound();
  }

  const [org] = await db
    .select({
      shopName: organizations.shopName,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
    })
    .from(organizations)
    .where(eq(organizations.id, job.orgId))
    .limit(1);

  const displayName = org?.shopName ?? org?.name ?? "Your Detailer";
  const brandColor = org?.accentColor ?? colors.purpleAction;

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
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-16 flex items-center justify-center">
        <div className="text-center">
          {/* Logo */}
          {org?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt={displayName}
              className="h-16 w-auto mx-auto mb-6 object-contain"
            />
          )}

          {/* Success icon */}
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)]"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <CheckCircle2
              className="h-8 w-8"
              style={{ color: brandColor }}
            />
          </div>

          {/* Heading */}
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3"
            style={{
              fontFamily: org?.nameFont
                ? FONT_VARIABLES[org.nameFont] ?? `'${org.nameFont}', sans-serif`
                : "inherit",
            }}
          >
            Quote Approved!
          </h1>

          <p className="text-base text-[var(--color-muted)] max-w-md mx-auto">
            {displayName} will be in touch to schedule your appointment.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center">
        <a
          href="https://detailforge.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-opacity hover:opacity-80"
        >
          <span className="opacity-50">Powered by</span>
          <Wordmark className="text-xs text-[var(--color-text)]" showDotIo />
        </a>
      </footer>
    </div>
  );
}
