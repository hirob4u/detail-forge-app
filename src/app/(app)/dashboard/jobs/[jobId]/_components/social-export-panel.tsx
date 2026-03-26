"use client";

import { useState } from "react";
import { Download, Loader2, AlertTriangle } from "lucide-react";

type AfterPhoto = {
  key: string;
  area: string;
  uploadedAt: string;
};

interface SocialExportPanelProps {
  jobId: string;
  afterPhotos: AfterPhoto[];
  plateBlockingEnabled: boolean;
  watermarkEnabled: boolean;
  hasLogo: boolean;
  shopName: string;
}

function formatAreaLabel(area: string): string {
  return area
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SocialExportPanel({
  jobId,
  afterPhotos,
  plateBlockingEnabled,
  watermarkEnabled,
  hasLogo,
  shopName,
}: SocialExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (afterPhotos.length === 0) return null;
  if (!plateBlockingEnabled && !watermarkEnabled) return null;

  async function handleExport(photoKey: string, area: string) {
    setExporting(photoKey);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/social-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shopName.replace(/\s+/g, "-").toLowerCase()}-${area}-social.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Export failed -- please try again",
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="mb-4">
        <h2
          className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Social Export
        </h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Download after photos ready for social media.
          {plateBlockingEnabled && " License plates will be blocked."}
          {watermarkEnabled && " Shop watermark will be applied."}
        </p>
        {plateBlockingEnabled && !hasLogo && (
          <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-badge)] border border-[var(--color-amber)]/40 bg-[var(--color-elevated)] px-3 py-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-amber)]" />
            <p className="text-xs text-[var(--color-amber)]">
              No logo uploaded. Plate blocks will use your shop name as text.
              Upload a logo in Settings for a better result.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-[var(--radius-badge)] bg-[var(--color-destructive)]/10 px-3 py-2 text-xs text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {afterPhotos.map((photo) => (
          <div
            key={photo.key}
            className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3"
          >
            <p className="text-sm font-medium text-[var(--color-text)]">
              {formatAreaLabel(photo.area)}
            </p>
            <button
              type="button"
              onClick={() => handleExport(photo.key, photo.area)}
              disabled={exporting === photo.key}
              className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === photo.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exporting === photo.key ? "Processing..." : "Download"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
