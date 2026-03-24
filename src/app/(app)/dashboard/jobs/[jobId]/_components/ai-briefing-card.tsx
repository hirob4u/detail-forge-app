import { Sparkles, AlertTriangle } from "lucide-react";
import type { AiBriefing } from "@/lib/types/ai";

interface AiBriefingCardProps {
  briefing: AiBriefing;
}

export default function AiBriefingCard({ briefing }: AiBriefingCardProps) {
  return (
    <section
      aria-labelledby="ai-briefing-heading"
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      {/* Header */}
      <h3
        id="ai-briefing-heading"
        className="mb-4 flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4 text-[var(--color-magenta)]" />
        <span
          className="text-xs font-medium uppercase tracking-wider text-[var(--color-magenta)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          AI Briefing
        </span>
      </h3>

      {/* Summary */}
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text)]">
        {briefing.summary}
      </p>

      {/* Customer Intent */}
      <div className="mb-4">
        <span
          className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          What they want
        </span>
        <p className="text-sm leading-relaxed text-[var(--color-text)]">
          {briefing.customerIntent}
        </p>
      </div>

      {/* Suggested Starting Point */}
      <div className="mb-4">
        <span
          className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Suggested starting point
        </span>
        <p className="text-sm leading-relaxed text-[var(--color-text)]">
          {briefing.suggestedStartingPoint}
        </p>
      </div>

      {/* Upsell Flags */}
      {briefing.upsellFlags.length > 0 && (
        <div className="mb-4">
          <span
            className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Upsell opportunities
          </span>
          <ul className="space-y-1">
            {briefing.upsellFlags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[var(--color-text)]"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-magenta)]" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Photo Follow-Up Warning */}
      {briefing.photoFollowUp && (
        <div className="flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-amber)]/10 px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-amber)]" />
          <span className="text-xs text-[var(--color-amber)]">
            Photos recommended before finalizing quote
          </span>
        </div>
      )}
    </section>
  );
}
