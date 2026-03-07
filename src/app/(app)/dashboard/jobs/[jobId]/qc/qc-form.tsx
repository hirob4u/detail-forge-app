"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Camera, X } from "lucide-react";
import type { ChecklistItem } from "@/lib/qc-checklist";

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
  trunk: "Trunk / Cargo",
  headliner: "Headliner",
  "engine-bay": "Engine Bay",
};

interface SignedPhoto {
  key: string;
  area: string;
  url: string;
}

export default function QcForm({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [qcNotes, setQcNotes] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<SignedPhoto[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<SignedPhoto[]>([]);
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
      setBeforePhotos(data.beforePhotos ?? []);
      setAfterPhotos(data.afterPhotos ?? []);
    } catch {
      // Silently ignore -- will show empty state
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadQcData();
  }, [loadQcData]);

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

        // Refresh QC state to get signed URL for the new photo
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
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading QC data...
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
      {beforePhotos.length > 0 && (
        <section>
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Before / After Photos
          </h2>
          <div className="space-y-3">
            {beforePhotos.map((before) => {
              const after = afterPhotos.find((a) => a.area === before.area);
              return (
                <div
                  key={before.key}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <p
                    className="mb-2 text-[10px] uppercase tracking-widest text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {AREA_LABELS[before.area] ?? before.area}
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
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhoto({
                            url: before.url,
                            label: `${AREA_LABELS[before.area] ?? before.area} — Before`,
                          })
                        }
                        className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={before.url}
                          alt="Before"
                          className="h-full w-full object-cover"
                        />
                      </button>
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
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPhoto({
                              url: after.url,
                              label: `${AREA_LABELS[after.area] ?? after.area} — After`,
                            })
                          }
                          className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-green)]/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={after.url}
                            alt="After"
                            className="h-full w-full object-cover"
                          />
                        </button>
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
          className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none resize-none"
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
