import { Check } from "lucide-react";
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

  const currentConfig = STAGE_CONFIG[currentStage];

  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
      role="list"
      aria-label="Job pipeline"
    >
      {/* Dots + connector lines */}
      <div className="flex items-center">
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
              {isPast ? (
                <div
                  role="img"
                  aria-label={`${config.label}: ${stateLabel}`}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[var(--radius-badge)] bg-[var(--color-green)]/20"
                >
                  <Check className="h-3 w-3 text-[var(--color-green)]" strokeWidth={3} />
                </div>
              ) : (
                <div
                  role="img"
                  aria-label={`${config.label}: ${stateLabel}`}
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-[var(--radius-badge)] transition-colors",
                    isCurrent && `${config.bg} ring-2 ${config.ring}`,
                    !isCurrent && "bg-[var(--color-border)]",
                  )}
                />
              )}

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

      {/* Current stage label — centered below dots */}
      <p
        className={cn(
          "mt-2 text-center text-[10px] font-medium uppercase tracking-wider",
          currentConfig.color,
        )}
        style={{ fontFamily: "var(--font-data)" }}
      >
        {currentConfig.label}
        <span className="text-[var(--color-muted)]">
          {" "}
          — {currentIndex + 1} of {PIPELINE_STAGES.length}
        </span>
      </p>
    </div>
  );
}
