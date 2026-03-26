"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { QuoteLineItem, FinalQuote } from "@/lib/types/quote";
import {
  ThumbsUp,
  ThumbsDown,
  CircleCheck,
  Circle,
  Plus,
  Loader2,
  X,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PhotoThumbnail from "@/app/(app)/_components/photo-thumbnail";
import CollapsibleSection from "@/app/(app)/_components/collapsible-section";
import StageBadge from "@/app/(app)/_components/stage-badge";

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

import type { ConditionAssessment } from "@/lib/types/assessment";

type PhotoMeta = {
  key: string;
  area: string;
  phase: string;
};

interface ReviewFormProps {
  jobId: string;
  assessment: ConditionAssessment;
  vehicle: { year: number; make: string; model: string; color: string };
  customer: { firstName: string; lastName: string | null };
  createdAt: string;
  stage: string;
  isQuoted: boolean;
  existingQuote: FinalQuote | null;
  hasPhotos: boolean;
}

// ---------------------------------------------------------------------------
// ServiceLineItem — compact row with collapsible note
// ---------------------------------------------------------------------------

function ServiceLineItem({
  item,
  index,
  isQuoted,
  onToggle,
  onUpdatePrice,
  onUpdateName,
  onUpdateDescription,
  onRemove,
}: {
  item: QuoteLineItem;
  index: number;
  isQuoted: boolean;
  onToggle: (i: number) => void;
  onUpdatePrice: (i: number, p: number) => void;
  onUpdateName: (i: number, n: string) => void;
  onUpdateDescription: (i: number, d: string) => void;
  onRemove: (i: number) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const isManual = item.basePrice === 0 && !item.note;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-button)] border p-3 transition-colors",
        item.included
          ? "border-[var(--color-border)] bg-[var(--color-elevated)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50",
      )}
    >
      {/* Main row: toggle + name + price + remove */}
      <div className="flex items-center gap-2">
        {!isQuoted && (
          <button
            type="button"
            onClick={() => onToggle(index)}
            className="shrink-0"
            aria-label={item.included ? "Exclude service" : "Include service"}
          >
            {item.included ? (
              <CircleCheck className="h-4 w-4 text-[var(--color-purple-action)]" />
            ) : (
              <Circle className="h-4 w-4 text-[var(--color-muted)]" />
            )}
          </button>
        )}

        <div className="min-w-0 flex-1">
          {!isQuoted && isManual ? (
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateName(index, e.target.value)}
              placeholder="Service name"
              className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none"
            />
          ) : (
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {item.name}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-[var(--color-muted)]">$</span>
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
              onChange={(e) => onUpdatePrice(index, Number(e.target.value))}
              disabled={!item.included}
              className="w-20 rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-right text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-data)" }}
            />
          )}
        </div>

        {/* Remove button */}
        {!isQuoted && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-destructive)]"
            aria-label="Remove service"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Description field for manually added items */}
      {!isQuoted && isManual && (
        <input
          type="text"
          value={item.description ?? ""}
          onChange={(e) => onUpdateDescription(index, e.target.value)}
          placeholder="Description (optional)"
          className="mt-2 w-full border-0 bg-transparent p-0 text-xs text-[var(--color-muted)] placeholder:text-[var(--color-muted)]/60 focus:outline-none"
        />
      )}

      {/* AI note — tap to expand */}
      {item.note && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setNoteOpen((prev) => !prev)}
            className="flex items-center gap-1 text-[10px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-150",
                noteOpen && "rotate-180",
              )}
            />
            AI note
          </button>
          {noteOpen && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
              {item.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
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

  // Stable key counter for line items (avoids index-as-key bugs on removal)
  const nextKeyRef = useRef(0);
  function getNextKey() {
    return nextKeyRef.current++;
  }

  // Quote line items -- initialize from AI recommended services or existing quote
  const [lineItems, setLineItems] = useState<(QuoteLineItem & { _key: number })[]>(() => {
    if (existingQuote) {
      return existingQuote.lineItems.map((item) => ({ ...item, _key: getNextKey() }));
    }
    return assessment.recommendedServices.map((svc) => ({
      _key: getNextKey(),
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

  function updateItemDescription(index: number, description: string) {
    if (isQuoted) return;
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, description } : item)),
    );
  }

  function addLineItem() {
    if (isQuoted) return;
    setLineItems((prev) => [
      ...prev,
      {
        _key: getNextKey(),
        name: "",
        note: "",
        basePrice: 0,
        adjustedPrice: 0,
        finalPrice: 0,
        included: true,
      },
    ]);
  }

  function removeLineItem(index: number) {
    if (isQuoted) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
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
            lineItems: lineItems.map(({ _key, ...rest }) => rest),
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

  return (
    <div className="space-y-6">
      {/* SECTION 1 -- Vehicle and customer header (compact) */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {customer.firstName}{customer.lastName ? ` ${customer.lastName}` : ""}
              <span className="font-normal text-[var(--color-muted)]">
                {" "}&middot; {vehicle.year} {vehicle.make} {vehicle.model} &mdash; {vehicle.color}
              </span>
            </p>
            <p
              className="mt-0.5 text-xs text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              Created {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
          <StageBadge stage={stage} analysisStatus="" />
        </div>
      </div>

      {/* SECTION -- Customer photos (filmstrip) */}
      {hasPhotos && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Customer Photos
          </h2>

          {metaLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading photos...</span>
            </div>
          ) : photoMeta.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              No photos were submitted with this job.
            </p>
          ) : (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {photoMeta.map((photo, index) => {
                const url = photoUrls[photo.key] ?? null;
                return (
                  <div key={photo.key} className="h-20 w-20 shrink-0">
                    <PhotoThumbnail
                      src={url}
                      alt={formatAreaLabel(photo.area)}
                      label={formatAreaLabel(photo.area)}
                      loading={urlsLoading && !url}
                      onClick={url ? () => setSelectedIndex(index) : undefined}
                    />
                  </div>
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

      {/* Vehicle mismatch warning — only show when photos were submitted */}
      {assessment.vehicleVerification &&
        !assessment.vehicleVerification.appearsToMatch &&
        hasPhotos && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 p-4">
            <p className="mb-1 text-sm font-semibold text-[var(--color-destructive)]">
              Vehicle Mismatch Detected
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {assessment.vehicleVerification.mismatchNote}
            </p>
          </div>
        )}

      {/* Two-column layout on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN -- Flags + Feedback */}
        <div className="space-y-4">
          {/* AI Flags — collapsible, open if flags exist */}
          <CollapsibleSection
            title="AI Flags"
            count={assessment.flags?.length ?? 0}
            defaultOpen={(assessment.flags?.length ?? 0) > 0}
          >
            <div className="space-y-3">
              {assessment.flags && assessment.flags.length > 0 ? (
                assessment.flags.map((flag, i) => {
                  const severityColors: Record<string, { badge: string; icon: string }> = {
                    moderate: {
                      badge: "bg-[var(--color-amber)]/10 border-[var(--color-amber)]/40 text-[var(--color-amber)]",
                      icon: "text-[var(--color-amber)]",
                    },
                    noted: {
                      badge: "bg-[var(--color-elevated)] border-[var(--color-border)] text-[var(--color-muted)]",
                      icon: "text-[var(--color-muted)]",
                    },
                    clear: {
                      badge: "bg-[var(--color-green)]/10 border-[var(--color-green)]/40 text-[var(--color-green)]",
                      icon: "text-[var(--color-green)]",
                    },
                    upsell: {
                      badge: "bg-[var(--color-magenta)]/10 border-[var(--color-magenta)]/25 text-[var(--color-magenta)]",
                      icon: "text-[var(--color-magenta)]",
                    },
                  };
                  const colors = severityColors[flag.severity] ?? severityColors.noted;
                  return (
                    <div
                      key={`${flag.severity}-${flag.title}-${i}`}
                      className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 space-y-1.5"
                    >
                      <span
                        className={`inline-block rounded-[var(--radius-badge)] border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors.badge}`}
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        {flag.severity}
                      </span>
                      <p className="text-sm font-medium text-[var(--color-text)]">{flag.title}</p>
                      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                        {flag.description}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  No flags from the AI assessment.
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* AI Feedback — collapsible, collapsed by default */}
          {!isQuoted && (
            <CollapsibleSection title="Leave Feedback" defaultOpen={false}>
              <div>
                <div className="flex gap-3">
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
                  className="mt-3 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] resize-none"
                />
              </div>
            </CollapsibleSection>
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

          {/* Line items — compact rows */}
          <div className="mt-4 space-y-2">
            {lineItems.map((item, index) => (
              <ServiceLineItem
                key={item._key}
                item={item}
                index={index}
                isQuoted={isQuoted}
                onToggle={toggleItem}
                onUpdatePrice={updatePrice}
                onUpdateName={updateItemName}
                onUpdateDescription={updateItemDescription}
                onRemove={removeLineItem}
              />
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
                className="mb-4 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] resize-none"
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
