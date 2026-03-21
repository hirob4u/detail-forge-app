import { cn } from "@/lib/utils";
import { STAGE_CONFIG, ANALYSIS_STATUS_CONFIG } from "./stage-config";

function getStageBadge(stage: string, analysisStatus: string) {
  // Analysis sub-statuses override the default "created" badge
  if (stage === "created" && analysisStatus in ANALYSIS_STATUS_CONFIG) {
    const status = ANALYSIS_STATUS_CONFIG[analysisStatus];
    return {
      label: status.label,
      className: `${status.color} ${status.bg}`,
    };
  }

  const config = STAGE_CONFIG[stage];
  if (config) {
    return {
      label: config.label,
      className: `${config.color} ${config.bg}`,
    };
  }

  // Fallback for unknown stages
  return {
    label: stage,
    className: "text-[var(--color-muted)] bg-[var(--color-muted)]/10",
  };
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
