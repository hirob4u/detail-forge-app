"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Camera, X } from "lucide-react";
import type { ChecklistItem } from "@/lib/qc-checklist";
import PhotoThumbnail from "@/app/(app)/_components/photo-thumbnail";
import PhotoGridSkeleton from "@/app/(app)/_components/photo-grid-skeleton";

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

type PhotoMeta = {
  key: string;
  area: string;
  phase?: string;
};

type AfterPhotoMeta = {
  key: string;
  area: string;
  uploadedAt: string;
};

export default function QcForm({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [qcNotes, setQcNotes] = useState("");
  const [beforeMeta, setBeforeMeta] = useState<PhotoMeta[]>([]);
  const [afterMeta, setAfterMeta] = useState<AfterPhotoMeta[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    label: string;
  } | null>(null);

  const allItemsPassed =
    checklist.length > 0 && checklist.every((item) => item.status === "pass");
  const pendingCount = checklist.filter(
    (item) => item.status !== "pass",
  ).length;

  const loadQcData = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/qc`);
      if (!res.ok) return;
      const data = await res.json();
      setChecklist(data.checklist ?? []);
      setQcNotes(data.qcNotes ?? "");
      setBeforeMeta(data.beforePhotos ?? []);
      setAfterMeta(data.afterPhotos ?? []);
    } catch {
      // Silently ignore -- will show empty state
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadQcData();
  }, [loadQcData]);

  // Phase 2 -- fetch presigned URLs once metadata arrives
  useEffect(() => {
    if (loading) return;
    const allKeys = [
      ...beforeMeta.map((p) => p.key),
      ...afterMeta.map((p) => p.key),
    ];
    if (allKeys.length === 0) return;

    setUrlsLoading(true);
    fetch(`/api/jobs/${jobId}/photos/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: allKeys }),
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
  }, [loading, jobId, beforeMeta, afterMeta]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPhoto]);

  // Keyboard navigation for lightbox -- escape to close
  useEffect(() => {
    if (!selectedPhoto) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedPhoto(null);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPhoto]);

  async function updateChecklistItem(
    index: number,
    status: "pass" | "needs-work" | "pending",
  ) {
    const updated = checklist.map((item, i) =>
      i === index ? { ...item, status } : item,
    );
    setChecklist(updated);

    await fetch(`/api/jobs/${jobId}/qc`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: updated, qcNotes }),
    });
  }

  async function saveNotes() {
    await fetch(`/api/jobs/${jobId}/qc`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist, qcNotes }),
    });
  }

  async function handleAfterPhotoUpload(area: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/heic";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(area);
      try {
        // Get presigned URL
        const presignRes = await fetch(`/api/jobs/${jobId}/qc/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            area,
            fileType: file.type,
            fileSize: file.size,
          }),
        });
        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, key } = await presignRes.json();

        // Upload to R2
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Save key to job
        await fetch(`/api/jobs/${jobId}/qc/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, area }),
        });

        // Refresh QC state to get updated metadata
        await loadQcData();
      } catch {
        // TODO: VERIFY error state
      } finally {
        setUploading(null);
      }
    };
    input.click();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PhotoGridSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1 -- Checklist */}
      <section>
        <h2
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          QC Checklist
        </h2>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div
              key={item.itemId}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text)]">
                    {item.label}
                  </p>
                  {item.note && (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {item.note}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateChecklistItem(
                        i,
                        item.status === "pass" ? "pending" : "pass",
                      )
                    }
                    className={`rounded-[var(--radius-badge)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      item.status === "pass"
                        ? "bg-[var(--color-green)] text-black"
                        : "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-green)] hover:text-[var(--color-green)]"
                    }`}
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateChecklistItem(
                        i,
                        item.status === "needs-work"
                          ? "pending"
                          : "needs-work",
                      )
                    }
                    className={`rounded-[var(--radius-badge)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      item.status === "needs-work"
                        ? "bg-[var(--color-amber)] text-black"
                        : "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]"
                    }`}
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    Rework
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 -- Before / After Photos */}
      {beforeMeta.length > 0 && (
        <section>
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Before / After Photos
          </h2>
          <div className="space-y-3">
            {beforeMeta.map((before) => {
              const after = afterMeta.find((a) => a.area === before.area);
              const beforeUrl = photoUrls[before.key] ?? null;
              const afterUrl = after ? (photoUrls[after.key] ?? null) : null;

              return (
                <div
                  key={before.key}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <p
                    className="mb-2 text-[10px] uppercase tracking-widest text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {formatAreaLabel(before.area)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Before */}
                    <div>
                      <p
                        className="mb-1 text-[10px] text-[var(--color-muted)]"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        Before
                      </p>
                      <PhotoThumbnail
                        src={beforeUrl}
                        alt={`${formatAreaLabel(before.area)} — Before`}
                        label={formatAreaLabel(before.area)}
                        loading={urlsLoading && !beforeUrl}
                        onClick={
                          beforeUrl
                            ? () =>
                                setSelectedPhoto({
                                  url: beforeUrl,
                                  label: `${formatAreaLabel(before.area)} — Before`,
                                })
                            : undefined
                        }
                      />
                    </div>

                    {/* After */}
                    <div>
                      <p
                        className="mb-1 text-[10px] text-[var(--color-muted)]"
                        style={{ fontFamily: "var(--font-data)" }}
                      >
                        After
                      </p>
                      {after ? (
                        <PhotoThumbnail
                          src={afterUrl}
                          alt={`${formatAreaLabel(after.area)} — After`}
                          label={formatAreaLabel(after.area)}
                          className="border-[var(--color-green)]/40"
                          loading={urlsLoading && !afterUrl}
                          onClick={
                            afterUrl
                              ? () =>
                                  setSelectedPhoto({
                                    url: afterUrl,
                                    label: `${formatAreaLabel(after.area)} — After`,
                                  })
                              : undefined
                          }
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={uploading === before.area}
                          onClick={() =>
                            handleAfterPhotoUpload(before.area)
                          }
                          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[var(--radius-button)] border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)] transition-colors hover:border-[var(--color-purple-action)]/50 disabled:cursor-not-allowed"
                        >
                          {uploading === before.area ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
                          ) : (
                            <div className="text-center">
                              <Camera className="mx-auto h-5 w-5 text-[var(--color-muted)]" />
                              <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                Add after
                              </p>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-[var(--radius-button)] p-2 text-white transition-colors hover:bg-white/10"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Label */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-[var(--radius-badge)] bg-black/60 px-3 py-1">
            <span
              className="text-xs uppercase tracking-widest text-white"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {selectedPhoto.label}
            </span>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.label}
            className="max-h-[85vh] max-w-[85vw] rounded-[var(--radius-card)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Section 3 -- Notes and completion */}
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <h2
          className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          QC Notes
        </h2>
        <textarea
          value={qcNotes}
          onChange={(e) => setQcNotes(e.target.value)}
          onBlur={saveNotes}
          rows={4}
          placeholder="Any notes about the final condition of the vehicle, exceptions, or customer communication..."
          className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none resize-none"
        />

        {/* Completion gate */}
        {allItemsPassed ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-green)]/40 bg-[var(--color-elevated)] p-4">
            <p className="mb-3 text-sm font-medium text-[var(--color-green)]">
              All checklist items passed. Ready to mark complete.
            </p>
            <Link
              href={`/dashboard/jobs/${jobId}`}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-green)] px-4 py-2 text-sm font-semibold text-black transition-colors hover:opacity-90"
            >
              Return to Job and Mark Complete
            </Link>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            {pendingCount} checklist{" "}
            {pendingCount === 1 ? "item" : "items"} remaining before this
            job can be marked complete.
          </p>
        )}
      </section>
    </div>
  );
}
