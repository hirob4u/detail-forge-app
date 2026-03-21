import { cn } from "@/lib/utils";
import { STAGE_CONFIG } from "@/app/(app)/_components/stage-config";
import type { JobStage } from "@/lib/db/schema";

/**
 * Pipeline stages in display order (excludes archived — it's not part of
 * the linear workflow).
 */
const PIPELINE_STAGES: JobStage[] = [
  "created",
  "quoted",
  "sent",
  "approved",
  "inProgress",
  "qc",
  "complete",
];

export default function StagePipeline({
  currentStage,
}: {
  currentStage: JobStage;
}) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage);

  // Unknown stage — guard against schema drift
  if (currentStage !== "archived" && currentIndex === -1) {
    return null;
  }

  // Archived jobs show a muted indicator instead of the pipeline
  if (currentStage === "archived") {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div
          aria-hidden="true"
          className="h-2 w-2 rounded-[var(--radius-badge)] bg-[var(--color-muted)]"
        />
        <span
          className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Archived
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
      role="list"
      aria-label="Job pipeline"
    >
      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage, i) => {
          const config = STAGE_CONFIG[stage];
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;

          const stateLabel = isPast
            ? "complete"
            : isCurrent
              ? "current stage"
              : "upcoming";

          return (
            <div
              key={stage}
              className="flex flex-1 items-center"
              role="listitem"
            >
              {/* Step dot + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  role="img"
                  aria-label={`${config.label}: ${stateLabel}`}
                  className={cn(
                    "h-2.5 w-2.5 rounded-[var(--radius-badge)] transition-colors",
                    isCurrent && `${config.bg} ring-2 ${config.ring}`,
                    isPast && "bg-[var(--color-green)]",
                    !isPast && !isCurrent && "bg-[var(--color-border)]",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider whitespace-nowrap",
                    isCurrent ? config.color : "text-[var(--color-muted)]",
                    isPast && "text-[var(--color-green)]",
                  )}
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {config.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px flex-1",
                    i < currentIndex
                      ? "bg-[var(--color-green)]"
                      : "bg-[var(--color-border)]",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
