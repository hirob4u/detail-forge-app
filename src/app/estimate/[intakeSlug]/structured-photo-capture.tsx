"use client";

import { useRef, useState, useEffect, Fragment } from "react";
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
  CircleCheck,
  X,
  type LucideIcon,
} from "lucide-react";

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
const DAMAGE_MAX = 4;

/* ------------------------------------------------------------------ */
/*  ShotTile                                                           */
/* ------------------------------------------------------------------ */

function ShotTile({
  shot,
  photo,
  accentColor,
  onFileSelect,
  onRetry,
  showRemove,
  onRemove,
  allowReupload,
}: {
  shot: ShotDefinition;
  photo: CapturedPhoto | undefined;
  accentColor: string;
  onFileSelect: (file: File) => void;
  onRetry: (id: string) => void;
  showRemove: boolean;
  onRemove?: (id: string) => void;
  allowReupload: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = shot.Icon;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && ACCEPTED_TYPES.has(file.type) && file.size <= MAX_SIZE) {
      onFileSelect(file);
    }
    e.target.value = "";
  }

  /* Empty state */
  if (!photo) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center transition-colors hover:border-[var(--color-border)]"
        >
          <Icon className="h-6 w-6 text-[var(--color-muted)]" />
          <span className="mt-1.5 text-xs font-semibold leading-tight text-[var(--color-text)]">
            {shot.label}
          </span>
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--color-muted)]">
            {shot.guidance}
          </span>
          <span className="mt-1.5 text-[10px]" style={{ color: accentColor }}>
            Tap to upload
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  /* Uploading / Done / Error states */
  return (
    <div className="group relative aspect-square">
      <img
        src={photo.previewUrl}
        alt={shot.label}
        className="h-full w-full rounded-[var(--radius-card)] object-cover"
      />

      {photo.status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-card)] bg-black/50">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: "var(--color-purple-action)" }}
          />
        </div>
      )}

      {photo.status === "done" && (
        <>
          <div className="absolute bottom-0 left-0 right-0 rounded-b-[var(--radius-card)] bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
            <span className="text-[10px] font-semibold text-white">
              {shot.label}
            </span>
          </div>
          <div className="absolute bottom-1 right-1">
            <CircleCheck className="h-4 w-4 text-[var(--color-green)]" />
          </div>
          {allowReupload && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 z-10 cursor-pointer rounded-[var(--radius-card)]"
              aria-label={`Re-upload ${shot.label}`}
            />
          )}
        </>
      )}

      {photo.status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-card)] bg-red-900/50">
          <button
            type="button"
            onClick={() => onRetry(photo.id)}
            className="min-h-[44px] min-w-[44px] text-[11px] font-medium text-white"
          >
            Failed — tap to retry
          </button>
        </div>
      )}

      {showRemove && photo.status === "done" && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(photo.id);
          }}
          className="absolute -right-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-elevated)] opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-[var(--color-text)]" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

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

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
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

  function getPhotoForArea(area: ShotArea): CapturedPhoto | undefined {
    return photos.find((p) => p.shotArea === area);
  }

  function getDamagePhotos(): CapturedPhoto[] {
    return photos.filter((p) => p.shotArea === "damage-area");
  }

  const requiredDoneCount = REQUIRED_SHOTS.filter(
    (s) => getPhotoForArea(s.area)?.status === "done",
  ).length;

  const damageAddRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* Required Shots */}
      <div
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] border-l-2 p-4"
        style={{ borderLeftColor: "var(--color-purple-action)" }}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            Required Photos
          </span>
          <span
            className={`flex items-center gap-1 text-xs ${
              requiredDoneCount === 8
                ? "text-[var(--color-green)]"
                : "text-[var(--color-muted)]"
            }`}
            style={{ fontFamily: "var(--font-data)" }}
          >
            {requiredDoneCount === 8 && (
              <CircleCheck className="h-3.5 w-3.5" />
            )}
            {requiredDoneCount} of 8 complete
          </span>
        </div>
        <p className="mb-4 text-[13px] text-[var(--color-muted)]">
          We need these 8 shots to build your estimate. Tap each one to upload.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REQUIRED_SHOTS.map((shot) => {
            const photo = getPhotoForArea(shot.area);
            return (
              <ShotTile
                key={shot.area}
                shot={shot}
                photo={photo}
                accentColor="var(--color-purple-action)"
                onFileSelect={(file) =>
                  handleFileForShot(shot.area, file, photo?.id)
                }
                onRetry={retryPhoto}
                showRemove={false}
                allowReupload={true}
              />
            );
          })}
        </div>
      </div>

      {/* Optional Shots */}
      <div
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] border-l-2 p-4"
        style={{ borderLeftColor: "var(--color-cyan)" }}
      >
        <div className="mb-1">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            Optional — Add More Detail
          </span>
        </div>
        <p className="mb-4 text-[13px] text-[var(--color-muted)]">
          Got a specific scratch, stained seat, or other area of concern? Add
          photos here to help us quote it accurately.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {OPTIONAL_SHOTS.map((shot) => {
            /* damage-area: multiple photos allowed */
            if (shot.area === "damage-area") {
              const damagePhotos = getDamagePhotos();
              return (
                <Fragment key="damage-area">
                  {damagePhotos.map((photo) => (
                    <ShotTile
                      key={photo.id}
                      shot={shot}
                      photo={photo}
                      accentColor="var(--color-cyan)"
                      onFileSelect={() => {}}
                      onRetry={retryPhoto}
                      showRemove={true}
                      onRemove={removePhoto}
                      allowReupload={false}
                    />
                  ))}
                  {damagePhotos.length < DAMAGE_MAX && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => damageAddRef.current?.click()}
                        className="flex aspect-square w-full flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center transition-colors hover:border-[var(--color-border)]"
                      >
                        <CircleAlert className="h-6 w-6 text-[var(--color-muted)]" />
                        <span className="mt-1.5 text-xs font-semibold leading-tight text-[var(--color-text)]">
                          {damagePhotos.length === 0
                            ? shot.label
                            : "Add Another"}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--color-muted)]">
                          {shot.guidance}
                        </span>
                        <span className="mt-1.5 text-[10px] text-[var(--color-cyan)]">
                          Tap to upload
                        </span>
                      </button>
                      <input
                        ref={damageAddRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (
                            file &&
                            ACCEPTED_TYPES.has(file.type) &&
                            file.size <= MAX_SIZE
                          ) {
                            handleFileForShot("damage-area", file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                  )}
                </Fragment>
              );
            }

            /* All other optional shots: single photo */
            const photo = getPhotoForArea(shot.area);
            return (
              <ShotTile
                key={shot.area}
                shot={shot}
                photo={photo}
                accentColor="var(--color-cyan)"
                onFileSelect={(file) =>
                  handleFileForShot(shot.area, file, photo?.id)
                }
                onRetry={retryPhoto}
                showRemove={true}
                onRemove={removePhoto}
                allowReupload={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
