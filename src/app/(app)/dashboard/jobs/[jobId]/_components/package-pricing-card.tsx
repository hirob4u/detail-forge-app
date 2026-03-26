import Link from "next/link";
import type { FinalQuote } from "@/lib/types/quote";
import type { ConditionAssessment } from "@/lib/types/assessment";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PackagePricingCardProps {
  jobId: string;
  stage: string;
  finalQuote: FinalQuote | null;
  aiAssessment: ConditionAssessment | null;
  analysisStatus: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a human-readable package label from the included line items. */
function derivePackageName(items: { name: string; included: boolean }[]): string {
  const included = items.filter((i) => i.included);
  if (included.length === 0) return "No services selected";
  if (included.length === 1) return included[0].name;
  // Use the first item as the "main" service, note the rest
  return included[0].name;
}

/** Status text + color class by stage. */
function stageStatus(stage: string): { text: string; colorClass: string } {
  switch (stage) {
    case "created":
      return { text: "Draft", colorClass: "text-[var(--color-muted)]" };
    case "quoted":
      return { text: "Awaiting customer approval", colorClass: "text-[var(--color-amber)]" };
    case "sent":
      return { text: "Quote sent — awaiting approval", colorClass: "text-[var(--color-amber)]" };
    case "approved":
      return { text: "Approved by customer", colorClass: "text-[var(--color-green)]" };
    case "inProgress":
      return { text: "Work in progress", colorClass: "text-[var(--color-green)]" };
    case "qc":
      return { text: "Quality check", colorClass: "text-[var(--color-purple-text)]" };
    case "complete":
      return { text: "Complete", colorClass: "text-[var(--color-green)]" };
    default:
      return { text: stage, colorClass: "text-[var(--color-muted)]" };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PackagePricingCard({
  jobId,
  stage,
  finalQuote,
  aiAssessment,
  analysisStatus,
}: PackagePricingCardProps) {
  const reviewHref = `/dashboard/jobs/${jobId}/review`;

  // ── Post-quote: finalized line items exist ──────────────────────────
  if (finalQuote) {
    const includedItems = finalQuote.lineItems.filter((i) => i.included);
    const packageName = derivePackageName(finalQuote.lineItems);
    const servicesList = includedItems.map((i) => i.name).join(", ");
    const { text: statusText, colorClass: statusColor } = stageStatus(stage);

    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Package + pricing
        </p>

        <div>
          <p className="text-base font-medium text-[var(--color-text)]">{packageName}</p>
          {includedItems.length > 1 && (
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
              {servicesList}
            </p>
          )}
        </div>

        <hr className="border-t border-[var(--color-border)]" />

        <div className="flex items-baseline gap-2">
          <span
            className="text-[30px] font-medium tracking-tight text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            ${finalQuote.totalPrice.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--color-muted)]">quoted</span>
        </div>

        <p className={`text-xs ${statusColor}`}>{statusText}</p>

        <div className="flex gap-2">
          <Link
            href={reviewHref}
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
          >
            Edit package
          </Link>
          <Link
            href={reviewHref}
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
          >
            Adjust price
          </Link>
        </div>
      </div>
    );
  }

  // ── Pre-quote: AI assessment exists but not finalized ───────────────
  if (aiAssessment && analysisStatus === "complete") {
    const services = aiAssessment.recommendedServices;
    const estimatedTotal = services.reduce((sum, s) => sum + s.adjustedPrice, 0);
    const servicesList = services.map((s) => s.name).join(", ");

    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Package + pricing
        </p>

        <div>
          <p className="text-base font-medium text-[var(--color-text)]">
            {services.length > 0 ? services[0].name : "AI Recommendation"}
          </p>
          {services.length > 1 && (
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
              {servicesList}
            </p>
          )}
        </div>

        <hr className="border-t border-[var(--color-border)]" />

        <div className="flex items-baseline gap-2">
          <span
            className="text-[30px] font-medium tracking-tight text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            ${estimatedTotal.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--color-muted)]">AI estimate</span>
        </div>

        <p className="text-xs text-[var(--color-muted)]">
          Review and finalize before sending to customer
        </p>

        <div className="flex gap-2">
          <Link
            href={reviewHref}
            className="rounded-[var(--radius-button)] border border-[var(--color-purple-action)]/40 bg-[var(--color-purple-action)]/10 px-3 py-1.5 text-xs text-[var(--color-purple-text)] transition-colors hover:bg-[var(--color-purple-action)]/25"
          >
            Review &amp; Finalize
          </Link>
        </div>
      </div>
    );
  }

  // ── Processing / no data ────────────────────────────────────────────
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
      <p
        className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Package + pricing
      </p>

      {analysisStatus === "processing" ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-purple-action)] border-t-transparent" />
          <p className="text-sm text-[var(--color-muted)]">AI analyzing vehicle&hellip;</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted)]">No estimate yet</p>
          <Link
            href={reviewHref}
            className="inline-block rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
          >
            Build quote manually
          </Link>
        </>
      )}
    </div>
  );
}
