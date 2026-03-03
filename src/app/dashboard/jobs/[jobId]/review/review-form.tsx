"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { QuoteLineItem, FinalQuote } from "@/lib/types/quote";
import {
  CircleAlert,
  ThumbsUp,
  ThumbsDown,
  CircleCheck,
  Circle,
  Plus,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VehicleVerification {
  appearsToMatch: boolean;
  observedVehicle: string;
  submittedVehicle: string;
  mismatchNote: string | null;
}

interface RecommendedService {
  name: string;
  note?: string;
  basePrice: number;
  adjustedPrice: number;
}

interface ConditionAssessment {
  vehicleVerification?: VehicleVerification;
  scores: Record<string, { score: number | null; description: string; recommendedService: string }>;
  recommendedServices: RecommendedService[];
  confidence: number;
  flags: string[];
}

interface ReviewFormProps {
  jobId: string;
  assessment: ConditionAssessment;
  vehicle: { year: number; make: string; model: string; color: string };
  customer: { firstName: string; lastName: string };
  createdAt: string;
  stage: string;
  isQuoted: boolean;
  existingQuote: FinalQuote | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReviewForm({
  jobId,
  assessment,
  vehicle,
  customer,
  createdAt,
  stage,
  isQuoted,
  existingQuote,
}: ReviewFormProps) {
  const router = useRouter();

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<"helpful" | "needs_work" | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  // Quote line items -- initialize from AI recommended services or existing quote
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(() => {
    if (existingQuote) {
      return existingQuote.lineItems;
    }
    return assessment.recommendedServices.map((svc) => ({
      name: svc.name,
      note: svc.note || "",
      basePrice: svc.basePrice,
      adjustedPrice: svc.adjustedPrice,
      finalPrice: svc.adjustedPrice,
      included: true,
    }));
  });

  const [detailerNotes, setDetailerNotes] = useState(existingQuote?.detailerNotes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const includedItems = lineItems.filter((i) => i.included);
  const totalPrice = includedItems.reduce((sum, i) => sum + i.finalPrice, 0);

  function toggleItem(index: number) {
    if (isQuoted) return;
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, included: !item.included } : item)),
    );
  }

  function updatePrice(index: number, price: number) {
    if (isQuoted) return;
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, finalPrice: price } : item)),
    );
  }

  function updateItemName(index: number, name: string) {
    if (isQuoted) return;
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item)),
    );
  }

  function addLineItem() {
    if (isQuoted) return;
    setLineItems((prev) => [
      ...prev,
      {
        name: "",
        note: "",
        basePrice: 0,
        adjustedPrice: 0,
        finalPrice: 0,
        included: true,
      },
    ]);
  }

  async function handleFinalize() {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/jobs/${jobId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalQuote: {
            lineItems,
            totalPrice,
            detailerNotes,
          },
          assessmentFeedbackRating: feedbackRating,
          assessmentFeedback: feedbackNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to finalize quote");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/jobs/${jobId}`);
    } catch {
      setError("Network error -- please try again");
      setSubmitting(false);
    }
  }

  const stageBadgeColor: Record<string, string> = {
    created: "text-[var(--color-amber)] border-[var(--color-amber)]",
    quoted: "text-[var(--color-cyan)] border-[var(--color-cyan)]",
    sent: "text-[var(--color-purple-text)] border-[var(--color-purple-text)]",
    approved: "text-[var(--color-green)] border-[var(--color-green)]",
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1 -- Vehicle and customer header */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-sm text-[var(--color-muted)]">Customer</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {customer.firstName} {customer.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-muted)]">Vehicle</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {vehicle.year} {vehicle.make} {vehicle.model} &mdash; {vehicle.color}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-muted)]">Created</p>
            <p
              className="text-sm text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span
              className={cn(
                "inline-block rounded-[var(--radius-badge)] border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                stageBadgeColor[stage] || "text-[var(--color-muted)] border-[var(--color-border)]",
              )}
              style={{ fontFamily: "var(--font-data)" }}
            >
              {stage}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN -- Flags + Feedback */}
        <div className="space-y-6">
          {/* SECTION 2 -- AI Flags panel */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              AI Assessment Flags
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Items to verify in person before finalizing the quote.
            </p>

            <div className="mt-4 space-y-3">
              {assessment.flags && assessment.flags.length > 0 ? (
                assessment.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <CircleAlert className="h-4 w-4 text-[var(--color-amber)]" />
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--color-text)]">
                        {flag}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  No flags from the AI assessment. Review the vehicle in person before
                  finalizing.
                </p>
              )}
            </div>

            {/* Vehicle mismatch warning */}
            {assessment.vehicleVerification &&
              !assessment.vehicleVerification.appearsToMatch && (
                <div className="mt-3 rounded-[var(--radius-card)] border border-red-800 bg-red-950/40 p-4">
                  <p className="mb-1 text-sm font-semibold text-red-400">
                    Vehicle Mismatch Detected
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {assessment.vehicleVerification.mismatchNote}
                  </p>
                </div>
              )}
          </div>

          {/* AI Assessment Feedback */}
          {!isQuoted && (
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                How was the AI assessment?
              </p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackRating("helpful")}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-button)] border px-4 py-2 text-sm font-medium transition-colors",
                    feedbackRating === "helpful"
                      ? "border-[var(--color-green)] bg-[var(--color-green)]/10 text-[var(--color-green)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Helpful
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackRating("needs_work")}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-button)] border px-4 py-2 text-sm font-medium transition-colors",
                    feedbackRating === "needs_work"
                      ? "border-[var(--color-amber)] bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Needs Work
                </button>
              </div>

              <textarea
                placeholder="What was wrong or missing? Your feedback improves future assessments."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                rows={3}
                className="mt-3 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] resize-none"
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN -- Quote builder */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Final Quote
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {isQuoted
              ? "This quote has been finalized."
              : "AI-recommended services are pre-loaded. Adjust prices and toggle services on or off before finalizing."}
          </p>

          {/* Line items */}
          <div className="mt-4 space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-[var(--radius-card)] border p-4 transition-colors",
                  item.included
                    ? "border-[var(--color-border)] bg-[var(--color-elevated)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Toggle included */}
                  {!isQuoted && (
                    <button
                      type="button"
                      onClick={() => toggleItem(index)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {item.included ? (
                        <CircleCheck className="h-5 w-5 text-[var(--color-purple-action)]" />
                      ) : (
                        <Circle className="h-5 w-5 text-[var(--color-muted)]" />
                      )}
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* Service name -- editable if blank (manually added) */}
                    {!isQuoted && item.basePrice === 0 && !item.note ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemName(index, e.target.value)}
                        placeholder="Service name"
                        className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {item.name}
                      </p>
                    )}
                    {/* AI note */}
                    {item.note && (
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
                        {item.note}
                      </p>
                    )}
                  </div>

                  {/* Price input */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-[var(--color-muted)]">$</span>
                      {isQuoted ? (
                        <span
                          className="text-sm text-[var(--color-text)]"
                          style={{ fontFamily: "var(--font-data)" }}
                        >
                          {item.finalPrice.toFixed(2)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          value={item.finalPrice}
                          onChange={(e) => updatePrice(index, Number(e.target.value))}
                          disabled={!item.included}
                          className="w-20 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-right text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] disabled:opacity-40"
                          style={{ fontFamily: "var(--font-data)" }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add service button */}
          {!isQuoted && (
            <button
              type="button"
              onClick={addLineItem}
              className="mt-3 flex items-center gap-2 text-sm text-[var(--color-purple-text)] transition-colors hover:text-[var(--color-purple-action)]"
            >
              <Plus className="h-4 w-4" />
              Add service
            </button>
          )}

          {/* Total bar */}
          <div className="sticky bottom-0 mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            {error && (
              <p className="mb-3 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-text)]">Total</span>
              <span
                className="text-xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Detailer notes */}
            {isQuoted ? (
              detailerNotes && (
                <p className="mb-4 text-sm text-[var(--color-muted)]">{detailerNotes}</p>
              )
            ) : (
              <textarea
                placeholder="Add notes for the customer or your own records..."
                value={detailerNotes}
                onChange={(e) => setDetailerNotes(e.target.value)}
                rows={2}
                className="mb-4 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] resize-none"
              />
            )}

            {!isQuoted && (
              <button
                type="button"
                onClick={handleFinalize}
                disabled={submitting || includedItems.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)] disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CircleCheck className="h-4 w-4" />
                    Finalize Quote
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
