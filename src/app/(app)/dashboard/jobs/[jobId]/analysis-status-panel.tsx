"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  CircleCheck,
  CircleAlert,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

interface AnalysisStatusPanelProps {
  jobId: string;
  initialAnalysisStatus: "processing" | "complete" | "failed";
  initialStage: string;
  initialHasAssessment: boolean;
  retryPayload: {
    photoKeys: string[];
    vehicleYear: number;
    vehicleMake: string;
    vehicleModel: string;
    vehicleColor: string;
  };
}

export default function AnalysisStatusPanel({
  jobId,
  initialAnalysisStatus,
  initialStage,
  initialHasAssessment,
  retryPayload,
}: AnalysisStatusPanelProps) {
  const [analysisStatus, setAnalysisStatus] = useState(initialAnalysisStatus);
  const [stage, setStage] = useState(initialStage);
  const [hasAssessment, setHasAssessment] = useState(initialHasAssessment);
  const [retrying, setRetrying] = useState(false);

  const shouldPoll = analysisStatus === "processing";

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setAnalysisStatus(data.analysisStatus);
      setStage(data.stage);
      setHasAssessment(data.hasAssessment);
    } catch {
      // Silently ignore poll errors -- will retry on next interval
    }
  }, [jobId]);

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [shouldPoll, poll]);

  async function handleRetryAnalysis() {
    setRetrying(true);
    setAnalysisStatus("processing");

    try {
      await fetch(`/api/estimates/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          ...retryPayload,
        }),
      });
    } catch (err) {
      console.error("Retry analysis failed:", err);
    } finally {
      setRetrying(false);
    }
  }

  // State 4 -- quoted
  if (stage === "quoted") {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CircleCheck className="h-6 w-6 text-[var(--color-green)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Quote Finalized
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                This job has been quoted.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/jobs/${jobId}/review`}
            className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-purple-action)]"
          >
            View Quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // State 1 -- processing
  if (analysisStatus === "processing") {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-purple-action)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Analyzing photos...
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              The AI is reviewing the vehicle photos. This usually takes 15-30
              seconds.
            </p>
          </div>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
          <div
            className="h-full animate-pulse rounded-full bg-[var(--color-purple-action)]"
            style={{ width: "60%" }}
          />
        </div>
      </div>
    );
  }

  // State 2 -- complete
  if (analysisStatus === "complete" && hasAssessment) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-purple-action)]/30 bg-[var(--color-purple-deep)]/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CircleCheck className="h-6 w-6 text-[var(--color-purple-action)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                AI Assessment Ready
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Review the findings and build your quote.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/jobs/${jobId}/review`}
            className="flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)]"
          >
            Review Assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // State 3 -- failed
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
              The AI assessment did not complete. You can try again or build the
              quote manually.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRetryAnalysis}
          disabled={retrying}
          className="flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-purple-action)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Analysis
        </button>
      </div>
    </div>
  );
}
