"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CircleAlert,
  RefreshCw,
  Mail,
} from "lucide-react";

const MAX_RETRIES = 3;
const STUCK_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

interface AnalysisStatusPanelProps {
  jobId: string;
  initialAnalysisStatus: "processing" | "complete" | "failed";
  initialStage: string;
  initialHasAssessment: boolean;
  initialRetryCount: number;
  initialUpdatedAt: string;
  photoCount: number;
}

export default function AnalysisStatusPanel({
  jobId,
  initialAnalysisStatus,
  initialStage,
  initialHasAssessment,
  initialRetryCount,
  initialUpdatedAt,
  photoCount,
}: AnalysisStatusPanelProps) {
  const router = useRouter();
  const hasRefreshed = useRef(false);

  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);
  const [stage, setStage] = useState(initialStage);
  const [hasAssessment, setHasAssessment] = useState(initialHasAssessment);
  const [retryCount, setRetryCount] = useState(initialRetryCount);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const shouldPoll = analysisStatus === "processing";

  const isStuck =
    analysisStatus === "processing" &&
    updatedAt &&
    Date.now() - new Date(updatedAt).getTime() > STUCK_THRESHOLD_MS;

  const hasRetriesLeft = retryCount < MAX_RETRIES;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setAnalysisStatus(data.analysisStatus);
      setStage(data.stage);
      setHasAssessment(data.hasAssessment);
      setRetryCount(data.analysisRetryCount ?? 0);
      if (data.updatedAt) setUpdatedAt(data.updatedAt);

      // When analysis finishes (complete or failed), refresh the server
      // components so AI briefing, condition notes, and pricing cards
      // pick up the new aiAssessment data from the DB.
      if (
        (data.analysisStatus === "complete" ||
          data.analysisStatus === "failed") &&
        !hasRefreshed.current
      ) {
        hasRefreshed.current = true;
        router.refresh();
      }
    } catch {
      // Silently ignore poll errors -- will retry on next interval
    }
  }, [jobId, router]);

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [shouldPoll, poll]);

  async function handleRetryAnalysis() {
    setRetrying(true);
    setRetryError(null);
    setAnalysisStatus("processing");

    try {
      const res = await fetch(`/api/jobs/${jobId}/retry-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error ?? "Retry failed. Please try again.";
        setRetryError(msg);
        setAnalysisStatus("failed");
      } else {
        const data = await res.json();
        setRetryCount(data.retryCount);
        setUpdatedAt(new Date().toISOString());
      }
    } catch (err) {
      console.error("Retry analysis failed:", err);
      setRetryError("Network error. Please check your connection.");
      setAnalysisStatus("failed");
    } finally {
      setRetrying(false);
    }
  }

  // State: Quoted — handled by PackagePricingCard now
  if (stage === "quoted" || stage === "sent" || stage === "approved" || stage === "inProgress" || stage === "qc" || stage === "complete") {
    return null;
  }

  // State: Processing (not stuck) — spinner with photo count
  if (analysisStatus === "processing" && !isStuck) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-purple-action)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Analyzing {photoCount} photo{photoCount !== 1 ? "s" : ""}...
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              The AI is reviewing the vehicle photos. This usually takes 15-30
              seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State: Stuck (processing > 2 min)
  if (analysisStatus === "processing" && isStuck) {
    return (
      <div className="rounded-[var(--radius-card)] border border-amber-700 bg-amber-950/40 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CircleAlert className="h-6 w-6 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Analysis is taking longer than expected
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {hasRetriesLeft
                  ? "This can happen occasionally. Try restarting the analysis."
                  : "We've been unable to complete the analysis. Please contact support."}
              </p>
            </div>
          </div>
          {hasRetriesLeft ? (
            <button
              type="button"
              onClick={handleRetryAnalysis}
              disabled={retrying}
              className="flex items-center gap-2 rounded-[var(--radius-button)] border border-amber-700 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:border-amber-500 hover:text-amber-200 disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
              />
              {retrying ? "Retrying..." : "Retry Analysis"}
            </button>
          ) : (
            <a
              href="mailto:support@detailforge.io?subject=Analysis stuck&body=Job ID: ${jobId}"
              className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-purple-action)]"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
          )}
        </div>
        {retryCount > 0 && hasRetriesLeft && (
          <p
            className="mt-3 text-xs text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Attempt {retryCount} of {MAX_RETRIES}
          </p>
        )}
      </div>
    );
  }

  // State: Complete — assessment ready — handled by PackagePricingCard +
  // AIConditionNotesCard now. Only render if analysis complete but no
  // assessment (edge case).
  if (analysisStatus === "complete" && hasAssessment) {
    return null;
  }

  // State: Failed — with retry or support contact
  return (
    <div className="rounded-[var(--radius-card)] border border-red-800 bg-red-950/40 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CircleAlert className="h-6 w-6 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Analysis Failed
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {hasRetriesLeft
                ? "The AI assessment did not complete. You can try again or build the quote manually."
                : "We were unable to complete the analysis after multiple attempts. Please contact support for assistance."}
            </p>
            {retryError && (
              <p className="mt-1 text-xs text-red-400">{retryError}</p>
            )}
          </div>
        </div>
        {hasRetriesLeft ? (
          <button
            type="button"
            onClick={handleRetryAnalysis}
            disabled={retrying}
            className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-purple-action)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
            />
            {retrying ? "Retrying..." : "Retry Analysis"}
          </button>
        ) : (
          <a
            href={`mailto:support@detailforge.io?subject=Analysis%20failed&body=Job%20ID%3A%20${jobId}`}
            className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-purple-action)]"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        )}
      </div>
      {retryCount > 0 && hasRetriesLeft && (
        <p
          className="mt-3 text-xs text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Attempt {retryCount} of {MAX_RETRIES}
        </p>
      )}
    </div>
  );
}
