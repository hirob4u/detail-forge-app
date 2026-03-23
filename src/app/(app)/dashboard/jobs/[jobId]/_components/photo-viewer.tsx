"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Send,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageOff,
} from "lucide-react";
import PhotoThumbnail from "@/app/(app)/_components/photo-thumbnail";

interface PhotoMeta {
  key: string;
  area: string;
  phase: string;
}

const AREA_LABELS: Record<string, string> = {
  "driver-side": "Driver Side",
  "passenger-side": "Passenger Side",
  front: "Front",
  rear: "Rear",
  hood: "Hood",
  "driver-seat": "Driver Seat",
  "rear-seat": "Rear Seat",
  dashboard: "Dashboard",
  "damage-area": "Damage Area",
  wheel: "Wheel",
  trunk: "Trunk",
  headliner: "Headliner",
  "engine-bay": "Engine Bay",
};

function formatAreaLabel(area: string): string {
  return AREA_LABELS[area] ?? area;
}

interface PhotoViewerProps {
  jobId: string;
  initialPhotoCount: number;
  hasNewPhotos: boolean;
  customerEmail: string | null;
  photoRequestSentAt: string | null;
}

export default function PhotoViewer({
  jobId,
  initialPhotoCount,
  hasNewPhotos: initialHasNewPhotos,
  customerEmail,
  photoRequestSentAt,
}: PhotoViewerProps) {
  const [photoMeta, setPhotoMeta] = useState<PhotoMeta[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasNewPhotos, setHasNewPhotos] = useState(initialHasNewPhotos);
  const [requestingPhotos, setRequestingPhotos] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [requestSent, setRequestSent] = useState(!!photoRequestSentAt);

  // Phase 1: Fetch metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/photos/meta`);
        if (!res.ok) return;
        const data = await res.json();
        setPhotoMeta(data.photos ?? []);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, [jobId]);

  // Phase 2: Fetch presigned URLs
  useEffect(() => {
    if (photoMeta.length === 0) return;
    setUrlsLoading(true);
    async function loadUrls() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/photos/urls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: photoMeta.map((p) => p.key) }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const urlMap: Record<string, string> = {};
        for (const photo of data.photos ?? []) {
          urlMap[photo.key] = photo.url;
        }
        setPhotoUrls(urlMap);
      } catch {
        // Silently fail
      } finally {
        setUrlsLoading(false);
      }
    }
    loadUrls();
  }, [jobId, photoMeta]);

  async function handleRequestPhotos() {
    setRequestingPhotos(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/request-photos`, {
        method: "POST",
      });
      if (res.ok) setRequestSent(true);
    } catch {
      // Silently fail
    } finally {
      setRequestingPhotos(false);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry-analysis`, {
        method: "POST",
      });
      if (res.ok) setHasNewPhotos(false);
    } catch {
      // Silently fail
    } finally {
      setReanalyzing(false);
    }
  }

  async function handleDismiss() {
    setHasNewPhotos(false);
    fetch(`/api/jobs/${jobId}/photos/acknowledge`, { method: "PATCH" }).catch(
      () => {},
    );
  }

  // Lightbox keyboard navigation + body scroll lock
  useEffect(() => {
    if (selectedIndex === null) return;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft")
        setSelectedIndex((i) => (i !== null ? Math.max(0, i - 1) : null));
      if (e.key === "ArrowRight")
        setSelectedIndex((i) =>
          i !== null ? Math.min(photoMeta.length - 1, i + 1) : null,
        );
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, photoMeta.length]);

  const selectedPhoto = selectedIndex !== null ? photoMeta[selectedIndex] : null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-[var(--color-muted)]" />
          <span
            className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Photos
          </span>
          {initialPhotoCount > 0 && (
            <span
              className="text-xs text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {initialPhotoCount}
            </span>
          )}
        </div>

        {customerEmail && (
          <button
            type="button"
            onClick={handleRequestPhotos}
            disabled={requestingPhotos}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] hover:border-[var(--color-purple-action)] disabled:cursor-not-allowed"
          >
            {requestingPhotos ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {requestSent ? "Resend Request" : "Request Photos"}
          </button>
        )}
      </div>

      {/* New photos banner */}
      {hasNewPhotos && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--color-purple-action)]/25 bg-[var(--color-purple-action)]/10 px-3 py-2">
          <span className="text-xs font-medium text-[var(--color-text)]">
            Customer added new photos
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center gap-1 rounded-[var(--radius-badge)] bg-[var(--color-purple-action)] px-2.5 py-1 text-[10px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {reanalyzing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Re-analyze
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-[var(--radius-badge)] px-2 py-1 text-[10px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && photoMeta.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ImageOff className="h-8 w-8 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">No photos yet</p>
          {customerEmail && !requestSent && (
            <p className="text-xs text-[var(--color-muted)]">
              Use the button above to request photos from the customer
            </p>
          )}
        </div>
      )}

      {/* Photo filmstrip — horizontal scroll like review page */}
      {!loading && photoMeta.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
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

      {/* Lightbox */}
      {selectedPhoto && photoUrls[selectedPhoto.key] && selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-[var(--radius-button)] p-2 text-white transition-colors hover:bg-white/10"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close lightbox"
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
              <span className="ml-2 text-white/60">
                {formatAreaLabel(selectedPhoto.area)}
              </span>
            </span>
          </div>

          {selectedIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {selectedIndex < photoMeta.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrls[selectedPhoto.key]}
              alt={formatAreaLabel(selectedPhoto.area)}
              className="max-h-[85vh] max-w-[90vw] rounded-[var(--radius-card)] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
