"use client";

import { useRef, useState, useEffect } from "react";
import {
  Car,
  ArrowUp,
  ArrowDown,
  Sun,
  Armchair,
  Users,
  Gauge,
  CircleAlert,
  Circle,
  Package,
  Layers,
  Wrench,
  Loader2,
  Check,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ShotArea =
  | "driver-side"
  | "passenger-side"
  | "front"
  | "rear"
  | "hood"
  | "driver-seat"
  | "rear-seat"
  | "dashboard"
  | "damage-area"
  | "wheel"
  | "trunk"
  | "headliner"
  | "engine-bay";

interface ShotDefinition {
  area: ShotArea;
  label: string;
  guidance: string;
  required: boolean;
  Icon: LucideIcon;
}

interface CapturedPhoto {
  id: string;
  shotArea: ShotArea;
  file: File;
  previewUrl: string;
  r2Key?: string;
  status: "uploading" | "done" | "error";
}

/* ------------------------------------------------------------------ */
/*  Shot definitions                                                   */
/* ------------------------------------------------------------------ */

const REQUIRED_SHOTS: ShotDefinition[] = [
  {
    area: "driver-side",
    label: "Driver Side",
    guidance:
      "Stand back to capture the full side. Hood to bumper, roof to rocker.",
    required: true,
    Icon: Car,
  },
  {
    area: "passenger-side",
    label: "Passenger Side",
    guidance:
      "Same as driver side — full side of the vehicle, step back far enough.",
    required: true,
    Icon: Car,
  },
  {
    area: "front",
    label: "Front",
    guidance:
      "Straight on from the front. Capture the full bumper, grille, and hood line.",
    required: true,
    Icon: ArrowUp,
  },
  {
    area: "rear",
    label: "Rear",
    guidance:
      "Straight on from the rear. Full bumper, trunk/tailgate, and taillights.",
    required: true,
    Icon: ArrowDown,
  },
  {
    area: "hood",
    label: "Hood",
    guidance:
      "Stand at the front corner and shoot across the hood. Shows swirls, oxidation, and water spots best.",
    required: true,
    Icon: Sun,
  },
  {
    area: "driver-seat",
    label: "Driver Seat & Interior",
    guidance:
      "Open the driver door and shoot the full interior forward — seat, dash, carpet, and center console.",
    required: true,
    Icon: Armchair,
  },
  {
    area: "rear-seat",
    label: "Rear Seat",
    guidance:
      "Open a rear door and capture the full rear seating area including carpet and door panels.",
    required: true,
    Icon: Users,
  },
  {
    area: "dashboard",
    label: "Dashboard",
    guidance:
      "From the driver seat, shoot the full dashboard, steering wheel, and instrument cluster.",
    required: true,
    Icon: Gauge,
  },
];

const OPTIONAL_SHOTS: ShotDefinition[] = [
  {
    area: "damage-area",
    label: "Damage or Problem Area",
    guidance:
      "Close-up of any specific scratch, dent, stain, or area of concern. Add multiple if needed.",
    required: false,
    Icon: CircleAlert,
  },
  {
    area: "wheel",
    label: "Wheel Close-up",
    guidance:
      "One wheel close enough to see the finish condition and brake dust buildup.",
    required: false,
    Icon: Circle,
  },
  {
    area: "trunk",
    label: "Trunk or Cargo Area",
    guidance:
      "Open the trunk or hatch and capture the full cargo area including carpet and liner.",
    required: false,
    Icon: Package,
  },
  {
    area: "headliner",
    label: "Headliner",
    guidance:
      "Shoot straight up from inside the vehicle to show the full headliner condition.",
    required: false,
    Icon: Layers,
  },
  {
    area: "engine-bay",
    label: "Engine Bay",
    guidance:
      "Open the hood and capture the full engine bay. Useful for full-detail packages.",
    required: false,
    Icon: Wrench,
  },
];

export const REQUIRED_SHOT_AREAS = REQUIRED_SHOTS.map((s) => s.area);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALL_SHOTS = [...REQUIRED_SHOTS, ...OPTIONAL_SHOTS];

/* ------------------------------------------------------------------ */
/*  StructuredPhotoCapture                                             */
/* ------------------------------------------------------------------ */

interface StructuredPhotoCaptureProps {
  orgSlug: string;
  onPhotosChange: (
    photos: Array<{ key: string; area: ShotArea; phase: "before" }>,
  ) => void;
}

export default function StructuredPhotoCapture({
  orgSlug,
  onPhotosChange,
}: StructuredPhotoCaptureProps) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [mode, setMode] = useState<"guided" | "batch">("guided");
  const [currentStep, setCurrentStep] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const donePhotos = photos
      .filter((p) => p.status === "done" && p.r2Key)
      .map((p) => ({
        key: p.r2Key!,
        area: p.shotArea,
        phase: "before" as const,
      }));
    onPhotosChange(donePhotos);
  }, [photos, onPhotosChange]);

  async function uploadFile(entry: CapturedPhoto) {
    try {
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

      const { presignedUrl, key } = await presignRes.json();

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": entry.file.type },
        body: entry.file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === entry.id
            ? { ...p, status: "done" as const, r2Key: key }
            : p,
        ),
      );
    } catch {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === entry.id ? { ...p, status: "error" as const } : p,
        ),
      );
    }
  }

  function handleFileForShot(area: ShotArea, file: File, replaceId?: string) {
    const newEntry: CapturedPhoto = {
      id: crypto.randomUUID(),
      shotArea: area,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    };

    setPhotos((prev) => {
      let updated = prev;
      if (replaceId) {
        const old = prev.find((p) => p.id === replaceId);
        if (old) URL.revokeObjectURL(old.previewUrl);
        updated = prev.filter((p) => p.id !== replaceId);
      }
      return [...updated, newEntry];
    });

    uploadFile(newEntry);
  }

  function retryPhoto(id: string) {
    const entry = photos.find((p) => p.id === id);
    if (!entry) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "uploading" as const } : p,
      ),
    );
    uploadFile(entry);
  }

  function handleInputChange(
    area: ShotArea,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (file && ACCEPTED_TYPES.has(file.type) && file.size <= MAX_SIZE) {
      const existing = photos.find(
        (p) => p.shotArea === area && p.status === "done",
      );
      handleFileForShot(area, file, existing?.id);
    }
    e.target.value = "";
  }

  /* ---- Derived values used by both modes ---- */

  const completedRequired = REQUIRED_SHOTS.filter((s) =>
    photos.some((p) => p.shotArea === s.area && p.status === "done"),
  ).length;

  const shot = ALL_SHOTS[currentStep];
  const currentPhoto = photos.find(
    (p) => p.shotArea === shot.area && p.status !== "error",
  );

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("guided")}
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium transition-colors",
            mode === "guided"
              ? "bg-[var(--color-purple-action)] text-white"
              : "bg-[var(--color-elevated)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
          )}
        >
          Step-by-step
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium transition-colors",
            mode === "batch"
              ? "bg-[var(--color-purple-action)] text-white"
              : "bg-[var(--color-elevated)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
          )}
        >
          Upload all at once
        </button>
      </div>

      {/* Guided Mode */}
      {mode === "guided" && (
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {completedRequired} of 8 required shots
              </span>
              <span
                className="text-xs text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                {currentStep + 1} / {ALL_SHOTS.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--color-purple-action)] transition-all"
                style={{ width: `${(completedRequired / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Current shot card */}
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-5">
            <div className="mb-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-base font-semibold text-[var(--color-text)]">
                  {shot.label}
                </span>
                {shot.required ? (
                  <span
                    className="rounded-[var(--radius-badge)] bg-[var(--color-purple-deep)] px-2 py-0.5 text-[10px] uppercase text-[var(--color-purple-text)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    Required
                  </span>
                ) : (
                  <span
                    className="rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-2 py-0.5 text-[10px] uppercase text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    Optional
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                {shot.guidance}
              </p>
            </div>

            {/* Upload zone */}
            {currentPhoto?.status === "done" ? (
              <div className="relative overflow-hidden rounded-[var(--radius-button)]">
                <img
                  src={currentPhoto.previewUrl}
                  alt={shot.label}
                  className="w-full rounded-[var(--radius-button)] object-cover"
                  style={{ maxHeight: "260px" }}
                />
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-green)]">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <button
                  type="button"
                  onClick={() => inputRefs.current[shot.area]?.click()}
                  className="absolute bottom-3 right-3 rounded-[var(--radius-badge)] bg-black/60 px-3 py-1.5 text-xs text-white"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRefs.current[shot.area]?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12 transition-colors hover:border-[var(--color-purple-action)]"
              >
                {currentPhoto?.status === "uploading" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-purple-action)]" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-[var(--color-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-purple-text)]">
                      Tap to upload
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      JPEG, PNG, WebP, or HEIC · max 10MB
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Error state inline */}
            {currentPhoto?.status === "error" && (
              <button
                type="button"
                onClick={() => retryPhoto(currentPhoto.id)}
                className="mt-2 w-full rounded-[var(--radius-button)] bg-red-900/30 px-4 py-2 text-sm text-white transition-colors hover:bg-red-900/50"
              >
                Upload failed — tap to retry
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1 rounded-[var(--radius-button)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
            >
              Previous
            </button>

            {/* Thumbnail strip */}
            <div className="flex max-w-[180px] gap-1.5 overflow-x-auto">
              {ALL_SHOTS.map((s, i) => {
                const p = photos.find(
                  (ph) => ph.shotArea === s.area && ph.status === "done",
                );
                return (
                  <button
                    key={s.area}
                    type="button"
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "h-8 w-8 flex-shrink-0 overflow-hidden rounded-[var(--radius-badge)] border-2 transition-all",
                      i === currentStep
                        ? "border-[var(--color-purple-action)]"
                        : "border-transparent opacity-50 hover:opacity-100",
                    )}
                  >
                    {p ? (
                      <img
                        src={p.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--color-elevated)]">
                        <span
                          className="text-[8px] text-[var(--color-muted)]"
                          style={{ fontFamily: "var(--font-data)" }}
                        >
                          {i + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentStep((s) =>
                  Math.min(ALL_SHOTS.length - 1, s + 1),
                )
              }
              disabled={currentStep === ALL_SHOTS.length - 1}
              className="flex items-center gap-1 rounded-[var(--radius-button)] px-4 py-2 text-sm text-[var(--color-purple-text)] transition-colors disabled:opacity-30"
            >
              {currentPhoto?.status === "done" ? "Next" : "Skip"}
            </button>
          </div>
        </div>
      )}

      {/* Batch Mode */}
      {mode === "batch" && (
        <div className="space-y-6">
          {/* Required shots */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                Required Photos
              </span>
              <span
                className={cn(
                  "text-xs transition-colors",
                  completedRequired === 8
                    ? "text-[var(--color-green)]"
                    : "text-[var(--color-muted)]",
                )}
                style={{ fontFamily: "var(--font-data)" }}
              >
                {completedRequired} of 8
              </span>
            </div>
            <div className="space-y-2">
              {REQUIRED_SHOTS.map((s) => {
                const photo = photos.find(
                  (p) => p.shotArea === s.area && p.status === "done",
                );
                const uploading = photos.find(
                  (p) => p.shotArea === s.area && p.status === "uploading",
                );
                return (
                  <div
                    key={s.area}
                    className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {s.label}
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
                        {s.guidance}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {photo ? (
                        <div className="relative h-16 w-16">
                          <img
                            src={photo.previewUrl}
                            alt={s.label}
                            className="h-full w-full rounded-[var(--radius-button)] object-cover"
                          />
                          <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-green)]">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inputRefs.current[s.area]?.click()}
                          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-purple-action)]"
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-purple-action)]" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                              <span className="text-[9px] text-[var(--color-muted)]">
                                Add
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional shots */}
          <div>
            <div className="mb-3">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                Optional — Add More Detail
              </span>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Got a specific scratch, stain, or area of concern? Add photos
                here.
              </p>
            </div>
            <div className="space-y-2">
              {OPTIONAL_SHOTS.map((s) => {
                const photo = photos.find(
                  (p) => p.shotArea === s.area && p.status === "done",
                );
                const uploading = photos.find(
                  (p) => p.shotArea === s.area && p.status === "uploading",
                );
                return (
                  <div
                    key={s.area}
                    className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {s.label}
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
                        {s.guidance}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {photo ? (
                        <div className="relative h-16 w-16">
                          <img
                            src={photo.previewUrl}
                            alt={s.label}
                            className="h-full w-full rounded-[var(--radius-button)] object-cover"
                          />
                          <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-green)]">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => inputRefs.current[s.area]?.click()}
                          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-purple-action)]"
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-purple-action)]" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                              <span className="text-[9px] text-[var(--color-muted)]">
                                Add
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs for all shots */}
      {ALL_SHOTS.map((s) => (
        <input
          key={s.area}
          ref={(el) => {
            inputRefs.current[s.area] = el;
          }}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleInputChange(s.area, e)}
        />
      ))}
    </div>
  );
}
