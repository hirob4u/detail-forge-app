"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConditionFlag, FlagSeverity } from "@/lib/types/assessment";

// ---------------------------------------------------------------------------
// Severity → inline icon + color
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  FlagSeverity,
  { icon: string; color: string; priority: number }
> = {
  moderate: { icon: "\u26A0", color: "text-[var(--color-amber)]", priority: 1 },
  upsell:   { icon: "\u2197", color: "text-[var(--color-magenta)]", priority: 2 },
  noted:    { icon: "\u2022", color: "text-[var(--color-muted)]", priority: 3 },
  clear:    { icon: "\u2713", color: "text-[var(--color-green)]", priority: 4 },
};

/** Max flags to show in collapsed teaser. */
const MAX_TEASER = 3;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AIConditionNotesCardProps {
  jobId: string;
  flags: ConditionFlag[];
  reasoning: string | null;
  /** Start expanded (show all flags). Default: false (3-flag teaser). */
  defaultExpanded?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIConditionNotesCard({
  jobId,
  flags,
  defaultExpanded = false,
}: AIConditionNotesCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (flags.length === 0) return null;

  // Sort by priority: moderate → upsell → noted → clear
  const sorted = [...flags].sort(
    (a, b) =>
      (SEVERITY_CONFIG[a.severity]?.priority ?? 99) -
      (SEVERITY_CONFIG[b.severity]?.priority ?? 99),
  );

  const canExpand = flags.length > MAX_TEASER;
  const visible = expanded ? sorted : sorted.slice(0, MAX_TEASER);

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
        {!expanded && canExpand && (
          <span
            className="text-[10px] text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            {MAX_TEASER} of {flags.length} shown
          </span>
        )}
        <span className="ml-auto text-[11px] text-[var(--color-muted)]">
          Informed the quote above
        </span>
      </div>

      {/* Flag rows */}
      <div className="space-y-1.5">
        {visible.map((flag, i) => {
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
              {expanded && flag.description && (
                <span className="text-xs text-[var(--color-muted)]">
                  — {flag.description}
                </span>
              )}
              {!expanded && (
                <span
                  className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {flag.severity}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand/collapse toggle + review link */}
      <div className="flex items-center gap-3">
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-[var(--color-purple-text)] hover:underline"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
            {expanded
              ? "Show less"
              : `Show all ${flags.length} notes`}
          </button>
        )}
        <Link
          href={`/dashboard/jobs/${jobId}/review`}
          className="text-xs text-[var(--color-purple-text)] hover:underline"
        >
          View full assessment →
        </Link>
      </div>
    </div>
  );
}
