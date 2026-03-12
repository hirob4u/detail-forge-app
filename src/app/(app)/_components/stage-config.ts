export const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  created: {
    label: "New",
    color: "text-[var(--color-amber)]",
    bg: "bg-yellow-900/20",
    border: "border-yellow-800/40",
  },
  quoted: {
    label: "Quoted",
    color: "text-[var(--color-cyan)]",
    bg: "bg-cyan-900/20",
    border: "border-cyan-800/40",
  },
  sent: {
    label: "Sent",
    color: "text-[var(--color-purple-text)]",
    bg: "bg-purple-900/20",
    border: "border-purple-800/40",
  },
  approved: {
    label: "Approved",
    color: "text-[var(--color-green)]",
    bg: "bg-green-900/20",
    border: "border-green-800/40",
  },
  inProgress: {
    label: "In Progress",
    color: "text-[var(--color-purple-action)]",
    bg: "bg-purple-900/20",
    border: "border-purple-800/40",
  },
  qc: {
    label: "QC",
    color: "text-[var(--color-amber)]",
    bg: "bg-amber-900/20",
    border: "border-amber-800/40",
  },
  complete: {
    label: "Complete",
    color: "text-[var(--color-green)]",
    bg: "bg-green-900/20",
    border: "border-green-800/40",
  },
};
