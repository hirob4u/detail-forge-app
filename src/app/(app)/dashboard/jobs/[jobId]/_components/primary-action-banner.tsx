import Link from "next/link";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type BannerVariant = "default" | "warning" | "success" | "muted";

interface PrimaryActionBannerProps {
  heading: string;
  subtext?: string;
  ctaLabel?: string;
  ctaHref?: string;
  variant?: BannerVariant;
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<
  BannerVariant,
  { border: string; heading: string; subtext: string; cta: string }
> = {
  default: {
    border: "border-[var(--color-purple-action)]/40",
    heading: "text-[var(--color-text)]",
    subtext: "text-[var(--color-muted)]",
    cta: "bg-[var(--color-purple-action)] hover:bg-[var(--color-purple-deep)] text-white",
  },
  success: {
    border: "border-[var(--color-green)]/40",
    heading: "text-[var(--color-green)]",
    subtext: "text-[var(--color-muted)]",
    cta: "bg-[var(--color-green)] hover:brightness-110 text-[var(--color-bg)]",
  },
  warning: {
    border: "border-[var(--color-amber)]/40",
    heading: "text-[var(--color-amber)]",
    subtext: "text-[var(--color-muted)]",
    cta: "bg-[var(--color-amber)] hover:brightness-110 text-[var(--color-bg)]",
  },
  muted: {
    border: "border-[var(--color-border)]",
    heading: "text-[var(--color-muted)]",
    subtext: "text-[var(--color-muted)]",
    cta: "",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PrimaryActionBanner({
  heading,
  subtext,
  ctaLabel,
  ctaHref,
  variant = "default",
}: PrimaryActionBannerProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`rounded-[var(--radius-card)] border ${styles.border} bg-[var(--color-elevated)] p-4 flex flex-wrap items-center justify-between gap-3`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${styles.heading}`}
          style={{ fontFamily: "var(--font-data)" }}
        >
          {heading}
        </p>
        {subtext && (
          <p className={`mt-0.5 text-xs ${styles.subtext}`}>{subtext}</p>
        )}
      </div>
      {ctaLabel && ctaHref && variant !== "muted" && (
        <Link
          href={ctaHref}
          className={`shrink-0 rounded-[var(--radius-button)] px-4 py-2 text-sm font-semibold transition-colors ${styles.cta}`}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
