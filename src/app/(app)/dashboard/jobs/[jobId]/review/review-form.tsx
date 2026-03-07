"use client";

import { useState, useEffect } from "react";
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
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PhotoThumbnail from "@/app/(app)/_components/photo-thumbnail";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert "driver-side" → "Driver Side" */
function formatAreaLabel(area: string): string {
  return area
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

type PhotoMeta = {
  key: string;
  area: string;
  phase: string;
};

interface ReviewFormProps {
  jobId: string;
  assessment: ConditionAssessment;
  vehicle: { year: number; make: string; model: string; color: string };
  customer: { firstName: string; lastName: string };
  createdAt: string;
  stage: string;
  isQuoted: boolean;
  existingQuote: FinalQuote | null;
  hasPhotos: boolean;
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
  hasPhotos,
}: ReviewFormProps) {
  const router = useRouter();

  // Two-phase photo state
  const [photoMeta, setPhotoMeta] = useState<PhotoMeta[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [metaLoading, setMetaLoading] = useState(hasPhotos);
  const [urlsLoading, setUrlsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Phase 1 -- metadata only, runs on mount
  useEffect(() => {
    if (!hasPhotos) return;
    fetch(`/api/jobs/${jobId}/photos/meta`)
      .then((r) => r.json())
      .then((data) => {
        setPhotoMeta(data.photos ?? []);
        setMetaLoading(false);
      })
      .catch(() => setMetaLoading(false));
  }, [jobId, hasPhotos]);

  // Phase 2 -- presigned URLs, runs once metadata is available
  useEffect(() => {
    if (metaLoading || photoMeta.length === 0) return;

    const keys = photoMeta.map((p) => p.key);

    fetch(`/api/jobs/${jobId}/photos/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    })
      .then((r) => r.json())
      .then((data) => {
        const urlMap: Record<string, string> = {};
        (data.photos ?? []).forEach((p: { key: string; url: string }) => {
          urlMap[p.key] = p.url;
        });
        setPhotoUrls(urlMap);
        setUrlsLoading(false);
      })
      .catch(() => setUrlsLoading(false));
  }, [jobId, metaLoading, photoMeta]);

  // Derived lightbox photo
  const selectedPhoto =
    selectedIndex !== null
      ? {
          url: photoUrls[photoMeta[selectedIndex]?.key ?? ""] ?? "",
          area: photoMeta[selectedIndex]?.area ?? "",
        }
      : null;

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setSelectedIndex((i) =>
          i !== null ? Math.min(i + 1, photoMeta.length - 1) : null,
        );
      }
      if (e.key === "ArrowLeft") {
        setSelectedIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
      }
      if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, photoMeta.length]);

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

      {/* SECTION -- Customer photos */}
      {hasPhotos && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Customer Photos
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Photos submitted with the intake form. Click to enlarge.
          </p>

          {metaLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading photos...</span>
            </div>
          ) : photoMeta.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              No photos were submitted with this job.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {photoMeta.map((photo, index) => {
                const url = photoUrls[photo.key] ?? null;
                return (
                  <PhotoThumbnail
                    key={photo.key}
                    src={url}
                    alt={formatAreaLabel(photo.area)}
                    label={formatAreaLabel(photo.area)}
                    loading={urlsLoading && !url}
                    onClick={url ? () => setSelectedIndex(index) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && selectedPhoto.url && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 rounded-[var(--radius-button)] p-2 text-white transition-colors hover:bg-white/10"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-4 rounded-[var(--radius-badge)] bg-black/60 px-3 py-1">
            <span
              className="text-xs text-white"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {selectedIndex + 1} / {photoMeta.length}
            </span>
          </div>

          {/* Area label */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-[var(--radius-badge)] bg-black/60 px-3 py-1">
            <span
              className="text-xs uppercase tracking-widest text-white"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {formatAreaLabel(selectedPhoto.area)}
            </span>
          </div>

          {/* Prev button */}
          {selectedIndex > 0 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-[var(--radius-button)] bg-black/60 p-3 text-white transition-colors hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((i) =>
                  i !== null ? Math.max(i - 1, 0) : null,
                );
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next button */}
          {selectedIndex < photoMeta.length - 1 && (
            <button
              type="button"
              className="absolute right-14 top-1/2 -translate-y-1/2 rounded-[var(--radius-button)] bg-black/60 p-3 text-white transition-colors hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((i) =>
                  i !== null ? Math.min(i + 1, photoMeta.length - 1) : null,
                );
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto.url}
            alt={formatAreaLabel(selectedPhoto.area)}
            className="max-h-[85vh] max-w-[85vw] rounded-[var(--radius-card)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
                          className="w-20 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-right text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
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
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
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
