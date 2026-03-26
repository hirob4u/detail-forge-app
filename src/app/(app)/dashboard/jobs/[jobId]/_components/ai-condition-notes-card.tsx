import Link from "next/link";
import type { ConditionFlag, FlagSeverity } from "@/lib/types/assessment";

// ---------------------------------------------------------------------------
// Severity → inline icon + color
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  FlagSeverity,
  { icon: string; color: string; priority: number }
> = {
  moderate: { icon: "⚠", color: "text-[var(--color-amber)]", priority: 1 },
  upsell:   { icon: "↗", color: "text-[var(--color-magenta)]", priority: 2 },
  noted:    { icon: "•", color: "text-[var(--color-muted)]", priority: 3 },
  clear:    { icon: "✓", color: "text-[var(--color-green)]", priority: 4 },
};

/** Max flags to show inline before "View all" link. */
const MAX_HIGHLIGHTS = 3;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AIConditionNotesCardProps {
  jobId: string;
  flags: ConditionFlag[];
  reasoning: string | null;
}

// ---------------------------------------------------------------------------
// Component — slim highlight bar
// ---------------------------------------------------------------------------

export default function AIConditionNotesCard({
  jobId,
  flags,
}: AIConditionNotesCardProps) {
  if (flags.length === 0) return null;

  // Sort by priority: moderate → upsell → noted → clear
  const sorted = [...flags].sort(
    (a, b) =>
      (SEVERITY_CONFIG[a.severity]?.priority ?? 99) -
      (SEVERITY_CONFIG[b.severity]?.priority ?? 99),
  );

  const highlights = sorted.slice(0, MAX_HIGHLIGHTS);
  const remaining = flags.length - highlights.length;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--color-magenta)]"
          style={{ boxShadow: "0 0 8px rgba(224, 64, 251, 0.4)" }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-magenta)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          AI condition notes
        </span>
        {flags.length > MAX_HIGHLIGHTS && (
          <span
            className="text-[10px] text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            {MAX_HIGHLIGHTS} of {flags.length} shown
          </span>
        )}
        <span className="ml-auto text-[11px] text-[var(--color-muted)]">
          Informed the quote above
        </span>
      </div>

      {/* Highlight rows */}
      <div className="space-y-1.5">
        {highlights.map((flag, i) => {
          const config = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.noted;
          return (
            <div
              key={`${flag.severity}-${flag.title}-${i}`}
              className="flex items-baseline gap-2 text-sm"
            >
              <span className={`shrink-0 ${config.color}`}>{config.icon}</span>
              <span className="font-medium text-[var(--color-text)]">
                {flag.title}
              </span>
              <span
                className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                {flag.severity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Link to full assessment */}
      <Link
        href={`/dashboard/jobs/${jobId}/review`}
        className="inline-block text-xs text-[var(--color-purple-text)] hover:underline"
      >
        {remaining > 0
          ? `View all ${flags.length} condition notes →`
          : "View full assessment →"}
      </Link>
    </div>
  );
}
