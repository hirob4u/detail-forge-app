import { cn } from "@/lib/utils";

function getStageBadge(stage: string, analysisStatus: string) {
  if (stage === "created" && analysisStatus === "processing") {
    return {
      label: "Analyzing...",
      className:
        "text-[var(--color-purple-text)] bg-[var(--color-purple-deep)]",
    };
  }
  if (stage === "created" && analysisStatus === "complete") {
    return {
      label: "Ready to Review",
      className: "text-[var(--color-amber)] bg-yellow-900/40",
    };
  }
  if (stage === "created" && analysisStatus === "failed") {
    return {
      label: "Analysis Failed",
      className: "text-red-400 bg-red-900/40",
    };
  }
  const map: Record<string, { label: string; className: string }> = {
    quoted: {
      label: "Quoted",
      className: "text-[var(--color-cyan)] bg-cyan-900/40",
    },
    sent: {
      label: "Sent",
      className: "text-[var(--color-purple-text)] bg-purple-900/40",
    },
    approved: {
      label: "Approved",
      className: "text-[var(--color-green)] bg-green-900/40",
    },
    inProgress: {
      label: "In Progress",
      className: "text-[var(--color-purple-action)] bg-purple-900/40",
    },
    qc: {
      label: "QC",
      className: "text-[var(--color-amber)] bg-amber-900/40",
    },
    complete: {
      label: "Complete",
      className: "text-[var(--color-green)] bg-green-900/40",
    },
  };
  return (
    map[stage] ?? {
      label: stage,
      className: "text-[var(--color-muted)] bg-[var(--color-elevated)]",
    }
  );
}

export default function StageBadge({
  stage,
  analysisStatus,
}: {
  stage: string;
  analysisStatus: string;
}) {
  const badge = getStageBadge(stage, analysisStatus);
  return (
    <span
      className={cn(
        "rounded-[var(--radius-badge)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        badge.className,
      )}
      style={{ fontFamily: "var(--font-data)" }}
    >
      {badge.label}
    </span>
  );
}
