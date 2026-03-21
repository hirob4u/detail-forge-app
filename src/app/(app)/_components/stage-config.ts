/**
 * Stage color configuration — single source of truth for all stage-related
 * UI (dashboard summary cards, job cards, stage badges).
 *
 * Colors follow a sequential warmth gradient through the job pipeline:
 *   cool (waiting) → warm (active) → green (done) → muted (archived)
 *
 * All colors reference CSS custom properties from design-tokens.ts.
 * No hardcoded Tailwind palette values.
 */
/**
 * Ordered list of pipeline stages for consistent iteration.
 * Archived is last — it's not part of the linear workflow.
 */
export const STAGE_ORDER = [
  "created",
  "quoted",
  "sent",
  "approved",
  "inProgress",
  "qc",
  "complete",
  "archived",
] as const;

export const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; ring: string }
> = {
  created: {
    label: "New",
    color: "text-[var(--color-muted)]",
    bg: "bg-[var(--color-muted)]/10",
    border: "border-[var(--color-muted)]/25",
    ring: "ring-[var(--color-muted)]/25",
  },
  quoted: {
    label: "Quoted",
    color: "text-[var(--color-cyan)]",
    bg: "bg-[var(--color-cyan)]/10",
    border: "border-[var(--color-cyan)]/25",
    ring: "ring-[var(--color-cyan)]/25",
  },
  sent: {
    label: "Sent",
    color: "text-[var(--color-purple-text)]",
    bg: "bg-[var(--color-purple-text)]/10",
    border: "border-[var(--color-purple-text)]/25",
    ring: "ring-[var(--color-purple-text)]/25",
  },
  approved: {
    label: "Approved",
    color: "text-[var(--color-green)]",
    bg: "bg-[var(--color-green)]/10",
    border: "border-[var(--color-green)]/25",
    ring: "ring-[var(--color-green)]/25",
  },
  inProgress: {
    label: "In Progress",
    color: "text-[var(--color-purple-action)]",
    bg: "bg-[var(--color-purple-action)]/10",
    border: "border-[var(--color-purple-action)]/25",
    ring: "ring-[var(--color-purple-action)]/25",
  },
  qc: {
    label: "QC",
    color: "text-[var(--color-amber)]",
    bg: "bg-[var(--color-amber)]/10",
    border: "border-[var(--color-amber)]/25",
    ring: "ring-[var(--color-amber)]/25",
  },
  complete: {
    label: "Complete",
    color: "text-[var(--color-green)]",
    bg: "bg-[var(--color-green)]/10",
    border: "border-[var(--color-green)]/25",
    ring: "ring-[var(--color-green)]/25",
  },
  archived: {
    label: "Archived",
    color: "text-[var(--color-muted)]",
    bg: "bg-[var(--color-muted)]/10",
    border: "border-[var(--color-muted)]/25",
    ring: "ring-[var(--color-muted)]/25",
  },
};

/**
 * Analysis sub-status badges for the "created" stage.
 * These override the default "New" badge when analysis is running.
 */
export const ANALYSIS_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  processing: {
    label: "Analyzing...",
    color: "text-[var(--color-purple-text)]",
    bg: "bg-[var(--color-purple-deep)]/40",
  },
  complete: {
    label: "Ready to Review",
    color: "text-[var(--color-amber)]",
    bg: "bg-[var(--color-amber)]/20",
  },
  failed: {
    label: "Analysis Failed",
    color: "text-[var(--color-destructive)]",
    bg: "bg-[var(--color-destructive)]/20",
  },
};
