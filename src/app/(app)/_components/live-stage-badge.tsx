"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { STAGE_CONFIG, ANALYSIS_STATUS_CONFIG } from "./stage-config";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LiveStageBadgeProps {
  jobId: string;
  stage: string;
  analysisStatus: string;
}

// ---------------------------------------------------------------------------
// Badge rendering (mirrors stage-badge.tsx logic)
// ---------------------------------------------------------------------------

function getStageBadge(stage: string, analysisStatus: string) {
  if (stage === "created" && analysisStatus in ANALYSIS_STATUS_CONFIG) {
    const status = ANALYSIS_STATUS_CONFIG[analysisStatus];
    return { label: status.label, className: `${status.color} ${status.bg}` };
  }
  const config = STAGE_CONFIG[stage];
  if (config) {
    return { label: config.label, className: `${config.color} ${config.bg}` };
  }
  return {
    label: stage,
    className: "text-[var(--color-muted)] bg-[var(--color-muted)]/10",
  };
}

// ---------------------------------------------------------------------------
// Component — polls only when analysisStatus is "processing"
// ---------------------------------------------------------------------------

export default function LiveStageBadge({
  jobId,
  stage: initialStage,
  analysisStatus: initialAnalysisStatus,
}: LiveStageBadgeProps) {
  const router = useRouter();
  const hasRefreshed = useRef(false);

  const [stage, setStage] = useState(initialStage);
  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);

  const shouldPoll = analysisStatus === "processing";

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setStage(data.stage);
      setAnalysisStatus(data.analysisStatus);

      // When analysis finishes, refresh the server components so the
      // full jobs list re-renders with updated data (quote, stage, etc.)
      if (
        (data.analysisStatus === "complete" ||
          data.analysisStatus === "failed") &&
        !hasRefreshed.current
      ) {
        hasRefreshed.current = true;
        router.refresh();
      }
    } catch {
      // Silently ignore — will retry on next interval
    }
  }, [jobId, router]);

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [shouldPoll, poll]);

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
