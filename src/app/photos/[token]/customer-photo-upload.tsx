"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import StructuredPhotoCapture, {
  type ShotArea,
} from "@/app/estimate/[intakeSlug]/structured-photo-capture";

interface CustomerPhotoUploadProps {
  token: string;
  orgSlug: string;
}

export default function CustomerPhotoUpload({
  token,
  orgSlug,
}: CustomerPhotoUploadProps) {
  const [photos, setPhotos] = useState<
    Array<{ key: string; area: ShotArea; phase: "before" }>
  >([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (photos.length === 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/photos/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoKeys: photos }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit photos.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit photos.",
      );
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-green)]/20">
          <Check className="h-6 w-6 text-[var(--color-green)]" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">
          Photos Received
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          Your detailer will review them shortly. You can safely close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      <StructuredPhotoCapture
        orgSlug={orgSlug}
        onPhotosChange={setPhotos}
        presignEndpoint={`/api/photos/${token}/presign`}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || photos.length === 0}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-brand-hover)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
      >
        {loading
          ? "Submitting..."
          : photos.length === 0
            ? "Add photos to submit"
            : `Submit ${photos.length} Photo${photos.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
