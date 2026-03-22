"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";
import { STAGE_TRANSITIONS, STAGE_LABELS } from "@/lib/stage-transitions";
import type { JobStage } from "@/lib/db/schema";

export default function StageControls({
  jobId,
  currentStage,
  customerEmail,
  quoteTotal,
  quoteSentAt,
}: {
  jobId: string;
  currentStage: JobStage;
  customerEmail?: string;
  quoteTotal?: number;
  quoteSentAt?: Date | null;
}) {
  const router = useRouter();
  const [pendingTo, setPendingTo] = useState<JobStage | null>(null);
  const [confirm, setConfirm] = useState<{
    to: JobStage;
    message: string;
    requireNote?: boolean;
  } | null>(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [flash, setFlash] = useState<"success" | "error" | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedTo, setLastFailedTo] = useState<JobStage | null>(null);
  const [lastFailedNote, setLastFailedNote] = useState<string | undefined>(
    undefined,
  );
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send-quote modal state
  const [sendQuoteConfirm, setSendQuoteConfirm] = useState<{
    to: JobStage;
    isResend: boolean;
  } | null>(null);

  // Clean up flash timeout on unmount
  useEffect(() => {
    return () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  // Clear stale error/flash state when stage changes (e.g. after router.refresh)
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    setFlash(null);
    setFlashMessage(null);
    setErrorMessage(null);
    setLastFailedTo(null);
    setLastFailedNote(undefined);
    setIsRefreshing(false);
    setSendQuoteConfirm(null);
  }, [currentStage]);

  const transitions = STAGE_TRANSITIONS[currentStage] ?? [];
  const forward = transitions.filter((t) => t.direction === "forward");
  const backward = transitions.filter((t) => t.direction === "backward");

  const pending = pendingTo !== null || isRefreshing;

  function showFlash(type: "success" | "error", message?: string) {
    setFlash(type);
    setFlashMessage(message ?? null);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    // Success flash auto-hides; error stays visible until next action or stage change
    if (type === "success") {
      flashTimeout.current = setTimeout(() => {
        setFlash(null);
        setFlashMessage(null);
      }, 3000);
    }
  }

  async function executeTransition(to: JobStage, note?: string) {
    setPendingTo(to);
    setConfirm(null);
    setConfirmNote("");
    setErrorMessage(null);
    setLastFailedTo(null);
    setLastFailedNote(undefined);
    try {
      const res = await fetch(`/api/jobs/${jobId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          ...(note ? { note: note.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Failed to update stage" }));
        throw new Error(data.error ?? "Failed to update stage");
      }
      showFlash("success");
      setIsRefreshing(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update stage";
      setErrorMessage(message);
      setLastFailedTo(to);
      setLastFailedNote(note);
      showFlash("error");
    } finally {
      setPendingTo(null);
    }
  }

  async function executeSendQuote() {
    const to = sendQuoteConfirm?.to ?? ("sent" as JobStage);
    setPendingTo(to);
    setSendQuoteConfirm(null);
    setErrorMessage(null);
    setLastFailedTo(null);
    setLastFailedNote(undefined);
    try {
      const res = await fetch(`/api/jobs/${jobId}/send-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Failed to send quote" }));
        throw new Error(data.error ?? "Failed to send quote");
      }
      const result = await res.json();
      showFlash(
        "success",
        `Quote ${result.isResend ? "resent" : "sent"} to ${result.sentTo}`,
      );
      setIsRefreshing(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send quote";
      setErrorMessage(message);
      setLastFailedTo(to);
      showFlash("error");
    } finally {
      setPendingTo(null);
    }
  }

  function handleTransition(
    to: JobStage,
    confirmMessage?: string,
    requireNote?: boolean,
    requiresQuoteSend?: boolean,
  ) {
    if (requiresQuoteSend) {
      setSendQuoteConfirm({
        to,
        isResend: !!quoteSentAt,
      });
    } else if (confirmMessage) {
      setConfirm({ to, message: confirmMessage, requireNote });
      setConfirmNote("");
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
        No actions available for this stage.
      </p>
    );
  }

  const formattedTotal = quoteTotal
    ? `$${Number(quoteTotal).toFixed(2)}`
    : "quote";

  return (
    <div className="space-y-3">
      {/* Success / error flash */}
      {flash === "success" && (
        <div className="flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-green)]/10 px-3 py-2 text-sm text-[var(--color-green)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {flashMessage ?? "Stage updated successfully"}
        </div>
      )}

      {flash === "error" && errorMessage && (
        <div className="flex items-center justify-between rounded-[var(--radius-button)] bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
          {lastFailedTo && (
            <button
              type="button"
              onClick={() =>
                executeTransition(lastFailedTo, lastFailedNote)
              }
              disabled={pending}
              className="shrink-0 text-xs font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Forward transitions */}
      {forward.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {forward.map((t) => (
            <button
              key={`${t.to}-${t.label}`}
              type="button"
              disabled={pending}
              onClick={() =>
                handleTransition(t.to, t.confirmMessage, t.requireNote, t.requiresQuoteSend)
              }
              className={`flex items-center gap-1.5 rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium text-white transition-colors disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed ${
                t.requiresQuoteSend
                  ? "bg-[var(--color-purple-action)] hover:bg-[var(--color-purple-deep)]"
                  : "bg-[var(--color-purple-action)] hover:bg-[var(--color-purple-deep)]"
              }`}
            >
              {pendingTo === t.to ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : t.requiresQuoteSend ? (
                <Send className="h-4 w-4" />
              ) : null}
              {t.label}
              {pendingTo !== t.to && !t.requiresQuoteSend && (
                <ChevronRight className="h-4 w-4" />
              )}
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
              onClick={() =>
                handleTransition(t.to, t.confirmMessage, t.requireNote)
              }
              className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
            >
              {pendingTo === t.to ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Send Quote confirmation dialog */}
      {sendQuoteConfirm && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-purple-action)]/40 bg-[var(--color-elevated)] p-4">
          <div className="flex items-start gap-3">
            <Send className="h-5 w-5 shrink-0 text-[var(--color-purple-text)]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {sendQuoteConfirm.isResend ? "Resend" : "Send"} {formattedTotal}{" "}
                quote to {customerEmail}?
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {sendQuoteConfirm.isResend
                  ? "The customer will receive an updated email with the same quote link."
                  : "The customer will receive an email with a link to view and approve this quote."}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={executeSendQuote}
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
                >
                  {pendingTo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  {sendQuoteConfirm.isResend ? "Resend Quote" : "Send Quote"}
                </button>
                <button
                  type="button"
                  onClick={() => setSendQuoteConfirm(null)}
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

      {/* Generic confirmation dialog */}
      {confirm && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-amber)]/40 bg-[var(--color-elevated)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-amber)]" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text)]">
                {confirm.message}
              </p>

              {/* Optional note input (used for reopen flow) */}
              {confirm.requireNote && (
                <textarea
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="Reason for reopening this job..."
                  rows={2}
                  className="mt-3 w-full resize-none rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
                />
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    executeTransition(
                      confirm.to,
                      confirm.requireNote
                        ? confirmNote.trim()
                        : undefined,
                    )
                  }
                  disabled={
                    pending || (confirm.requireNote && confirmNote.trim() === "")
                  }
                  className="rounded-[var(--radius-button)] bg-[var(--color-amber)] px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:opacity-90 disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
                >
                  {pendingTo === confirm.to ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Moving...
                    </span>
                  ) : (
                    `Move to ${STAGE_LABELS[confirm.to]}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirm(null);
                    setConfirmNote("");
                  }}
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
