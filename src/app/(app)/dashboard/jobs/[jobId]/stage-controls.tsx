"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { STAGE_TRANSITIONS, STAGE_LABELS } from "@/lib/stage-transitions";
import type { JobStage } from "@/lib/db/schema";

export default function StageControls({
  jobId,
  currentStage,
}: {
  jobId: string;
  currentStage: JobStage;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<{
    to: JobStage;
    message: string;
  } | null>(null);

  const transitions = STAGE_TRANSITIONS[currentStage] ?? [];
  const forward = transitions.filter((t) => t.direction === "forward");
  const backward = transitions.filter((t) => t.direction === "backward");

  async function executeTransition(to: JobStage) {
    setPending(true);
    setConfirm(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      router.refresh();
    } catch {
      // TODO: VERIFY error state UI
    } finally {
      setPending(false);
    }
  }

  function handleTransition(to: JobStage, confirmMessage?: string) {
    if (confirmMessage) {
      setConfirm({ to, message: confirmMessage });
    } else {
      executeTransition(to);
    }
  }

  if (transitions.length === 0) {
    return (
      <p
        className="text-xs text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        This job is complete. No further actions available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Forward transitions */}
      {forward.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {forward.map((t) => (
            <button
              key={t.to}
              type="button"
              disabled={pending}
              onClick={() => handleTransition(t.to, t.confirmMessage)}
              className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
            >
              {t.label}
              <ChevronRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* Backward transitions */}
      {backward.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {backward.map((t) => (
            <button
              key={t.to}
              type="button"
              disabled={pending}
              onClick={() => handleTransition(t.to, t.confirmMessage)}
              className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      {confirm && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-amber)]/40 bg-[var(--color-elevated)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-amber)]" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text)]">
                {confirm.message}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => executeTransition(confirm.to)}
                  disabled={pending}
                  className="rounded-[var(--radius-button)] bg-[var(--color-amber)] px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:opacity-90 disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
                >
                  {pending
                    ? "Moving..."
                    : `Move to ${STAGE_LABELS[confirm.to]}`}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  disabled={pending}
                  className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
