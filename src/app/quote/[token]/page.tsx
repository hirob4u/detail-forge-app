import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, vehicles, organizations } from "@/lib/db/schema";
import { colors } from "@/lib/design-tokens";
import { FONT_VARIABLES } from "@/lib/fonts";
import Wordmark from "@/components/wordmark";
import ApproveButton from "./approve-button";
import type { FinalQuote } from "@/lib/types/quote";

/** Stages where the quote page is viewable (sent and beyond, excluding archived). */
const VIEWABLE_STAGES = ["sent", "approved", "inProgress", "qc", "complete"];
/** Stages that mean the quote was already approved (redirect to confirmation). */
const APPROVED_STAGES = ["approved", "inProgress", "qc", "complete"];

export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Look up job by quote token
  const [job] = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      finalQuote: jobs.finalQuote,
      vehicleId: jobs.vehicleId,
      orgId: jobs.orgId,
    })
    .from(jobs)
    .where(eq(jobs.quoteToken, token))
    .limit(1);

  if (!job) {
    notFound();
  }

  if (!VIEWABLE_STAGES.includes(job.stage)) {
    return (
      <QuoteShell>
        <div className="py-24 text-center">
          <p className="text-lg font-semibold text-[var(--color-text)]">
            This quote is no longer available
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Please contact your detailer for an updated quote.
          </p>
        </div>
      </QuoteShell>
    );
  }

  // Already approved → show confirmation page
  if (APPROVED_STAGES.includes(job.stage)) {
    redirect(`/quote/${token}/approved`);
  }

  // Fetch related data
  const [vehicle] = await db
    .select({
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      color: vehicles.color,
    })
    .from(vehicles)
    .where(eq(vehicles.id, job.vehicleId))
    .limit(1);

  const [org] = await db
    .select({
      shopName: organizations.shopName,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
      businessEmail: organizations.businessEmail,
      phone: organizations.phone,
      contactPreference: organizations.contactPreference,
    })
    .from(organizations)
    .where(eq(organizations.id, job.orgId))
    .limit(1);

  if (!org) {
    notFound();
  }

  const displayName = org.shopName ?? org.name;
  const brandColor = org.accentColor ?? colors.purpleAction;
  const quote = job.finalQuote as FinalQuote | null;
  const includedItems = quote?.lineItems.filter((item) => item.included) ?? [];
  const vehicleDesc = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Your Vehicle";

  // Determine contact options based on preference and available data
  const contactPref = org.contactPreference ?? "both";
  const showEmail =
    (contactPref === "email" || contactPref === "both") && org.businessEmail;
  const showPhone =
    (contactPref === "phone" || contactPref === "both") && org.phone;
  // Fallback: if preference says one method but that field is empty, show the other
  const fallbackEmail = !showEmail && !showPhone && org.businessEmail;
  const fallbackPhone = !showEmail && !showPhone && org.phone;

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
      <main className="flex-1 w-full max-w-2xl mx-auto px-0 sm:px-8 py-6 sm:py-16">
        {/* Shop identity */}
        <header className="mb-0 px-4 sm:px-0">
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
                  ? FONT_VARIABLES[org.nameFont] ?? `'${org.nameFont}', sans-serif`
                  : "inherit",
              }}
            >
              {displayName}
            </span>
          </div>

          <p className="text-xs uppercase tracking-widest text-[var(--color-muted)] opacity-60 mb-6">
            Your detailing quote
          </p>

          <div
            className="h-0.5 w-10 mb-px"
            style={{ backgroundColor: brandColor }}
          />
          <hr className="border-[var(--color-border)]" />
        </header>

        {/* Quote content */}
        <section className="mt-8 sm:mt-10 px-4 sm:px-0">
          {/* Vehicle */}
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6">
            <p
              className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1"
              style={{ fontFamily: "var(--font-data)" }}
            >
              Vehicle
            </p>
            <p className="text-lg font-semibold text-[var(--color-text)]">
              {vehicleDesc}
            </p>
            {vehicle?.color && (
              <p className="text-sm text-[var(--color-muted)]">{vehicle.color}</p>
            )}
          </div>

          {/* Line items */}
          {includedItems.length > 0 && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6">
              <p
                className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-4"
                style={{ fontFamily: "var(--font-data)" }}
              >
                Services
              </p>
              <div className="space-y-3">
                {includedItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-[var(--color-text)]">
                      {item.name}
                    </span>
                    <span
                      className="text-sm text-[var(--color-text)] shrink-0"
                      style={{ fontFamily: "var(--font-data)" }}
                    >
                      ${item.finalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <hr className="my-4 border-[var(--color-border)]" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[var(--color-text)]">
                  Total
                </span>
                <span
                  className="text-xl font-bold text-[var(--color-text)]"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  ${(quote?.totalPrice ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Detailer notes */}
          {quote?.detailerNotes && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6">
              <p
                className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-data)" }}
              >
                Notes from {displayName}
              </p>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                {quote.detailerNotes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 mt-8">
            <ApproveButton token={token} />

            {/* Have Questions? */}
            {(showEmail || showPhone || fallbackEmail || fallbackPhone) && (
              <div className="text-center">
                <p className="text-xs text-[var(--color-muted)] mb-2">
                  Have questions?
                </p>
                <div className="flex justify-center gap-3">
                  {(showEmail || fallbackEmail) && (
                    <a
                      href={`mailto:${org.businessEmail}`}
                      className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-hover)]"
                    >
                      Email Us
                    </a>
                  )}
                  {(showPhone || fallbackPhone) && (
                    <a
                      href={`tel:${org.phone}`}
                      className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-hover)]"
                    >
                      Call Us
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
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

/** Minimal shell for error/unavailable states */
function QuoteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-background)]">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8">
        {children}
      </main>
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
