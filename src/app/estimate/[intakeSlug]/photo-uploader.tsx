"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, X, Loader2, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type PhotoStatus = "uploading" | "done" | "error";

interface PhotoEntry {
  id: string;
  file: File;
  previewUrl: string;
  publicUrl?: string;
  status: PhotoStatus;
}

const MAX_PHOTOS = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface PhotoUploaderProps {
  orgSlug: string;
  onPhotosChange: (urls: string[]) => void;
}

export default function PhotoUploader({
  orgSlug,
  onPhotosChange,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onPhotosChange(
      photos
        .filter((p) => p.status === "done" && p.publicUrl)
        .map((p) => p.publicUrl!)
    );
  }, [photos, onPhotosChange]);

  async function uploadFile(entry: PhotoEntry) {
    try {
      // Get presigned URL
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          fileName: entry.file.name,
          contentType: entry.file.type,
        }),
      });

      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, publicUrl } = await presignRes.json();

      // PUT file directly to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": entry.file.type },
        body: entry.file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      setPhotos((prev) => {
        const next = prev.map((p) =>
          p.id === entry.id ? { ...p, status: "done" as const, publicUrl } : p,
        );
        return next;
      });
    } catch {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === entry.id ? { ...p, status: "error" as const } : p,
        ),
      );
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);

    const newEntries: PhotoEntry[] = toAdd
      .filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_SIZE)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading" as const,
      }));

    setPhotos((prev) => [...prev, ...newEntries]);

    // Start uploads immediately
    newEntries.forEach((entry) => uploadFile(entry));
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((p) => p.id !== id);
      return next;
    });
  }

  function retryPhoto(id: string) {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "uploading" as const } : p,
      ),
    );
    const entry = photos.find((p) => p.id === id);
    if (entry) uploadFile(entry);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square">
            <img
              src={photo.previewUrl}
              alt="Vehicle photo"
              className="h-full w-full rounded-[var(--radius-button)] object-cover"
            />

            {/* Status overlay */}
            {photo.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-button)] bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-purple-text)]" />
              </div>
            )}

            {photo.status === "done" && (
              <div className="absolute bottom-1 right-1">
                <CircleCheck className="h-5 w-5 text-[var(--color-green)]" />
              </div>
            )}

            {photo.status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-button)] bg-black/50">
                <button
                  type="button"
                  onClick={() => retryPhoto(photo.id)}
                  className="rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-2 py-1 text-xs text-destructive"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-elevated)] opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3 text-[var(--color-text)]" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1",
              "rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)]",
              "text-[var(--color-muted)] transition-colors hover:border-[var(--color-purple-action)] hover:text-[var(--color-purple-text)]",
            )}
          >
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-[var(--color-muted)]">
        Up to {MAX_PHOTOS} photos, 10 MB each. JPEG, PNG, WebP, or HEIC.
      </p>
    </div>
  );
}
