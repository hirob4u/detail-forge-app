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
  Camera,
  ImagePlus,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
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

type CaptureMode = "rapid" | "guided" | "batch";

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
    label: "Damage / Problem Area",
    guidance:
      "Close-up of any specific scratch, dent, stain, or area of concern.",
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
    label: "Trunk / Cargo Area",
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
const MAX_PHOTOS = 20;
const UPLOAD_CONCURRENCY = 3;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALL_SHOTS = [...REQUIRED_SHOTS, ...OPTIONAL_SHOTS];
const ALL_SHOT_AREAS = new Set<string>(ALL_SHOTS.map((s) => s.area));

/** Map from area to human label for dropdowns */
const AREA_LABELS: Record<ShotArea, string> = Object.fromEntries(
  ALL_SHOTS.map((s) => [s.area, s.label]),
) as Record<ShotArea, string>;

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
  const [mode, setMode] = useState<CaptureMode>("rapid");
  const [currentStep, setCurrentStep] = useState(0);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Refs for file inputs
  const rapidInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const guidedInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Filmstrip scroll ref
  const filmstripRef = useRef<HTMLDivElement | null>(null);

  // AbortController for cancelling in-flight uploads on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  /* ---- Sync done photos upstream (debounced) ---- */
  const onPhotosChangeRef = useRef(onPhotosChange);
  onPhotosChangeRef.current = onPhotosChange;

  useEffect(() => {
    const timer = setTimeout(() => {
      const donePhotos = photos
        .filter((p) => p.status === "done" && p.r2Key)
        .map((p) => ({
          key: p.r2Key!,
          area: p.shotArea,
          phase: "before" as const,
        }));
      onPhotosChangeRef.current(donePhotos);
    }, 200);
    return () => clearTimeout(timer);
  }, [photos]);

  /* ---- Upload logic ---- */

  async function uploadFile(entry: CapturedPhoto) {
    try {
      const controller = abortControllerRef.current;
      if (!controller) return; // component unmounted before upload started
      const signal = controller.signal;
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          fileName: entry.file.name,
          contentType: entry.file.type,
        }),
        signal,
      });

      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const presignData: unknown = await presignRes.json();
      if (
        typeof presignData !== "object" ||
        presignData === null ||
        typeof (presignData as Record<string, unknown>).presignedUrl !== "string" ||
        typeof (presignData as Record<string, unknown>).key !== "string"
      ) {
        throw new Error("Invalid presign response shape");
      }
      const { presignedUrl, key } = presignData as {
        presignedUrl: string;
        key: string;
      };

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": entry.file.type },
        body: entry.file,
        signal,
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
    } catch (err: unknown) {
      // If aborted (component unmounting), skip the state update entirely
      if (err instanceof DOMException && err.name === "AbortError") return;
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === entry.id ? { ...p, status: "error" as const } : p,
        ),
      );
    }
  }

  function addPhoto(area: ShotArea, file: File) {
    const newEntry: CapturedPhoto = {
      id: crypto.randomUUID(),
      shotArea: area,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    };

    setPhotos((prev) => [...prev, newEntry]);
    uploadFile(newEntry);

    // Scroll filmstrip to end after a tick
    requestAnimationFrame(() => {
      filmstripRef.current?.scrollTo({
        left: filmstripRef.current.scrollWidth,
        behavior: "smooth",
      });
    });
  }

  function replacePhoto(replaceId: string, area: ShotArea, file: File) {
    const newEntry: CapturedPhoto = {
      id: crypto.randomUUID(),
      shotArea: area,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    };

    setPhotos((prev) => {
      const old = prev.find((p) => p.id === replaceId);
      if (old) URL.revokeObjectURL(old.previewUrl);
      return [...prev.filter((p) => p.id !== replaceId), newEntry];
    });

    uploadFile(newEntry);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const old = prev.find((p) => p.id === id);
      if (old) URL.revokeObjectURL(old.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function reassignPhoto(id: string, newArea: ShotArea) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, shotArea: newArea } : p)),
    );
  }

  function retryPhoto(id: string) {
    const entry = photosRef.current.find((p) => p.id === id);
    if (!entry) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "uploading" as const } : p,
      ),
    );
    uploadFile(entry);
  }

  // Need a stable ref to current photos for multi-file assignment
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Create AbortController on mount, abort + cleanup on unmount
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return () => {
      controller.abort();
      abortControllerRef.current = null;
      for (const p of photosRef.current) {
        URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, []);

  async function uploadBatch(entries: CapturedPhoto[]) {
    const queue = [...entries];
    const active: Promise<void>[] = [];

    while (queue.length > 0 || active.length > 0) {
      while (active.length < UPLOAD_CONCURRENCY && queue.length > 0) {
        const entry = queue.shift()!;
        const p = uploadFile(entry).then(() => {
          const idx = active.indexOf(p);
          if (idx >= 0) active.splice(idx, 1);
        });
        active.push(p);
      }
      if (active.length > 0) {
        await Promise.race(active);
      }
    }
  }

  function handleRapidFilesWithTracking(files: FileList | null) {
    if (!files) return;

    // Separate valid and rejected files for user feedback
    const validFiles: File[] = [];
    const rejectedReasons: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ACCEPTED_TYPES.has(file.type)) {
        rejectedReasons.push(`"${file.name}" — unsupported format`);
      } else if (file.size > MAX_SIZE) {
        rejectedReasons.push(`"${file.name}" — exceeds 10 MB limit`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0 && rejectedReasons.length > 0) {
      setLimitNotice(`Files rejected: ${rejectedReasons.join("; ")}`);
      return;
    }

    // Use functional updater to read latest state (prevents double-tap race)
    let entriesToUpload: CapturedPhoto[] = [];
    let pendingNotice: string | null = null;

    setPhotos((prev) => {
      const available = MAX_PHOTOS - prev.length;
      if (available <= 0) {
        pendingNotice = `Maximum of ${MAX_PHOTOS} photos reached.`;
        return prev;
      }

      const filesToProcess = validFiles.slice(0, available);
      const notices: string[] = [];

      if (rejectedReasons.length > 0) {
        notices.push(`Rejected: ${rejectedReasons.join("; ")}`);
      }
      if (validFiles.length > available) {
        notices.push(
          `Only ${available} more photo${available !== 1 ? "s" : ""} allowed (max ${MAX_PHOTOS}). Some files were skipped.`,
        );
      }
      pendingNotice = notices.length > 0 ? notices.join(" ") : null;

      // Track assignments across the batch so each file gets a different area
      const pendingAreas = new Set(
        prev
          .filter((p) => p.status === "done" || p.status === "uploading")
          .map((p) => p.shotArea),
      );

      const newEntries: CapturedPhoto[] = [];

      for (const file of filesToProcess) {
        // Find next unfilled area: required first, then optional, fallback damage-area
        let area: ShotArea = "damage-area";
        for (const shot of [...REQUIRED_SHOTS, ...OPTIONAL_SHOTS]) {
          if (!pendingAreas.has(shot.area)) {
            area = shot.area;
            break;
          }
        }

        pendingAreas.add(area);

        const newEntry: CapturedPhoto = {
          id: crypto.randomUUID(),
          shotArea: area,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "uploading",
        };
        newEntries.push(newEntry);
      }

      if (newEntries.length === 0) return prev;

      entriesToUpload = newEntries;
      return [...prev, ...newEntries];
    });

    // Set limit notice outside the state updater to avoid setState-in-setState
    setLimitNotice(pendingNotice);

    // Fire uploads in batches of UPLOAD_CONCURRENCY (after state update)
    if (entriesToUpload.length > 0) {
      uploadBatch(entriesToUpload);
    }

    // Scroll filmstrip to end
    requestAnimationFrame(() => {
      filmstripRef.current?.scrollTo({
        left: filmstripRef.current.scrollWidth,
        behavior: "smooth",
      });
    });
  }

  /* ---- Guided mode: handle file for specific shot ---- */

  function handleGuidedInputChange(
    area: ShotArea,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }

    // Validate file type and size with user feedback
    if (!ACCEPTED_TYPES.has(file.type)) {
      setLimitNotice(`"${file.name}" — unsupported format. Use JPEG, PNG, WebP, or HEIC.`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setLimitNotice(`"${file.name}" — exceeds 10 MB limit.`);
      e.target.value = "";
      return;
    }

    const existing = photos.find(
      (p) => p.shotArea === area && (p.status === "done" || p.status === "uploading"),
    );
    if (existing) {
      replacePhoto(existing.id, area, file);
    } else {
      // Enforce MAX_PHOTOS for new photos (replacements don't increase count)
      if (photos.length >= MAX_PHOTOS) {
        setLimitNotice(`Maximum of ${MAX_PHOTOS} photos reached.`);
        e.target.value = "";
        return;
      }
      addPhoto(area, file);
    }
    setLimitNotice(null);
    e.target.value = "";
  }

  /* ---- Derived values ---- */

  const completedRequired = REQUIRED_SHOTS.filter((s) =>
    photos.some((p) => p.shotArea === s.area && p.status === "done"),
  ).length;

  const totalPhotos = photos.length;
  const uploading = photos.filter((p) => p.status === "uploading").length;
  const errors = photos.filter((p) => p.status === "error").length;

  // For guided mode
  const shot = ALL_SHOTS[currentStep];
  const currentPhoto = shot
    ? photos.find((p) => p.shotArea === shot.area && p.status !== "error")
    : undefined;
  const currentErrorPhoto = shot
    ? photos.find((p) => p.shotArea === shot.area && p.status === "error")
    : undefined;

  // Which required areas are still missing (only "done" counts as filled)
  const missingRequired = REQUIRED_SHOTS.filter(
    (s) => !photos.some((p) => p.shotArea === s.area && p.status === "done"),
  );

  /* ---- Render ---- */

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Capture mode">
        {(
          [
            ["rapid", "Rapid"],
            ["guided", "Step-by-step"],
            ["batch", "All at once"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={cn(
              "rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-medium transition-colors",
              mode === key
                ? "bg-[var(--color-brand)] text-white"
                : "bg-[var(--color-elevated)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  RAPID MODE                                                   */}
      {/* ============================================================ */}
      {mode === "rapid" && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {completedRequired} of {REQUIRED_SHOTS.length} required
              </span>
              {uploading > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading {uploading}
                </span>
              )}
              {errors > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-amber)]">
                  <AlertTriangle className="h-3 w-3" />
                  {errors} failed
                </span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-300"
                style={{
                  width: `${(completedRequired / REQUIRED_SHOTS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Capture buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => rapidInputRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-6 transition-colors hover:border-[var(--color-brand)]"
            >
              <Camera className="h-8 w-8 text-[var(--color-brand)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">
                Take Photo
              </span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-6 transition-colors hover:border-[var(--color-brand)]"
            >
              <ImagePlus className="h-8 w-8 text-[var(--color-brand)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">
                From Gallery
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                Select multiple
              </span>
            </button>
          </div>

          {/* Photo limit notice */}
          {limitNotice && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-amber)] bg-[var(--color-elevated)] px-3 py-2 text-xs text-[var(--color-amber)]">
              {limitNotice}
            </div>
          )}

          {/* Hidden inputs for rapid mode */}
          <input
            ref={rapidInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleRapidFilesWithTracking(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleRapidFilesWithTracking(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Filmstrip */}
          {totalPhotos > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} — tap to assign area
              </span>
              <div
                ref={filmstripRef}
                role="list"
                aria-label="Captured photos"
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {photos.map((p) => (
                  <div
                    key={p.id}
                    role="listitem"
                    className="relative flex-shrink-0"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-button)]">
                      <img
                        src={p.previewUrl}
                        alt={AREA_LABELS[p.shotArea]}
                        className="h-full w-full object-cover"
                      />

                      {/* Status overlay */}
                      {p.status === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {p.status === "done" && (
                        <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-green)]">
                          <Check className="h-3 w-3 text-black" />
                        </div>
                      )}
                      {p.status === "error" && (
                        <button
                          type="button"
                          onClick={() => retryPhoto(p.id)}
                          aria-label={`Retry upload for ${AREA_LABELS[p.shotArea]}`}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60"
                        >
                          <AlertTriangle className="h-5 w-5 text-[var(--color-amber)]" />
                          <span className="text-[10px] font-medium text-white">
                            Retry
                          </span>
                        </button>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 transition-colors hover:bg-black/80"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>

                    {/* Area selector */}
                    <select
                      value={p.shotArea}
                      aria-label={`Assign area for photo ${AREA_LABELS[p.shotArea]}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (ALL_SHOT_AREAS.has(val)) {
                          reassignPhoto(p.id, val as ShotArea);
                        }
                      }}
                      className="mt-1.5 w-24 truncate rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-1.5 py-1 text-[10px] text-[var(--color-text)]"
                    >
                      {ALL_SHOTS.map((s) => (
                        <option key={s.area} value={s.area}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing required areas hint */}
          {totalPhotos > 0 && missingRequired.length > 0 && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3">
              <span className="mb-2 block text-xs font-medium text-[var(--color-muted)]">
                Still needed:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingRequired.map((s) => (
                  <span
                    key={s.area}
                    className="rounded-[var(--radius-badge)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Accepted formats note */}
          {totalPhotos === 0 && (
            <p className="text-center text-xs text-[var(--color-muted)]">
              JPEG, PNG, WebP, or HEIC &middot; max 10 MB each
            </p>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  GUIDED MODE                                                  */}
      {/* ============================================================ */}
      {mode === "guided" && (
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {completedRequired} of {REQUIRED_SHOTS.length} required shots
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
                className="h-full rounded-full bg-[var(--color-brand)] transition-all"
                style={{
                  width: `${(completedRequired / REQUIRED_SHOTS.length) * 100}%`,
                }}
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
                    className="rounded-[var(--radius-badge)] bg-[var(--color-brand)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white"
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
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-green)]">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <button
                  type="button"
                  onClick={() => guidedInputRefs.current[shot.area]?.click()}
                  className="absolute bottom-3 right-3 rounded-[var(--radius-badge)] bg-black/60 px-3 py-1.5 text-xs text-white"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => guidedInputRefs.current[shot.area]?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12 transition-colors hover:border-[var(--color-brand)]"
              >
                {currentPhoto?.status === "uploading" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-[var(--color-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-brand)]">
                      Tap to upload
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      JPEG, PNG, WebP, or HEIC &middot; max 10 MB
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Error state inline */}
            {currentErrorPhoto && (
              <button
                type="button"
                onClick={() => retryPhoto(currentErrorPhoto.id)}
                className="mt-2 w-full rounded-[var(--radius-button)] bg-[var(--color-destructive)]/20 px-4 py-2 text-sm text-white transition-colors hover:bg-[var(--color-destructive)]/30"
              >
                Upload failed — tap to retry
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-button)] border px-4 py-2 text-sm font-medium transition-colors",
                currentStep === 0
                  ? "border-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed"
                  : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-purple-action)] hover:text-[var(--color-purple-action)]",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex flex-col items-center gap-1">
              <span
                className="text-sm font-medium text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                {currentStep + 1} / {ALL_SHOTS.length}
              </span>
              <span
                className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                {currentStep < REQUIRED_SHOTS.length ? "Required" : "Optional"}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentStep((s) => Math.min(ALL_SHOTS.length - 1, s + 1))
              }
              disabled={currentStep === ALL_SHOTS.length - 1}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium transition-colors",
                currentStep === ALL_SHOTS.length - 1
                  ? "text-[var(--color-muted)] cursor-not-allowed"
                  : currentPhoto?.status === "done"
                    ? "bg-[var(--color-brand)] text-white hover:opacity-90"
                    : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {currentPhoto?.status === "done" ? "Next" : "Skip"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  BATCH MODE                                                   */}
      {/* ============================================================ */}
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
                  completedRequired === REQUIRED_SHOTS.length
                    ? "text-[var(--color-green)]"
                    : "text-[var(--color-muted)]",
                )}
                style={{ fontFamily: "var(--font-data)" }}
              >
                {completedRequired} of {REQUIRED_SHOTS.length}
              </span>
            </div>
            <div className="space-y-2">
              {REQUIRED_SHOTS.map((s) => {
                const areaPhotos = photos.filter(
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
                    <div className="flex flex-shrink-0 gap-1.5">
                      {areaPhotos.map((photo) => (
                        <div key={photo.id} className="relative h-16 w-16">
                          <img
                            src={photo.previewUrl}
                            alt={s.label}
                            className="h-full w-full rounded-[var(--radius-button)] object-cover"
                          />
                          <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-green)]">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => guidedInputRefs.current[s.area]?.click()}
                        className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-brand)]"
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand)]" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                            <span className="text-[10px] text-[var(--color-muted)]">
                              {areaPhotos.length > 0 ? "More" : "Add"}
                            </span>
                          </>
                        )}
                      </button>
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
                const areaPhotos = photos.filter(
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
                    <div className="flex flex-shrink-0 gap-1.5">
                      {areaPhotos.map((photo) => (
                        <div key={photo.id} className="relative h-16 w-16">
                          <img
                            src={photo.previewUrl}
                            alt={s.label}
                            className="h-full w-full rounded-[var(--radius-button)] object-cover"
                          />
                          <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-green)]">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => guidedInputRefs.current[s.area]?.click()}
                        className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-button)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-brand)]"
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand)]" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                            <span className="text-[10px] text-[var(--color-muted)]">
                              {areaPhotos.length > 0 ? "More" : "Add"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Uploads-in-progress indicator (all modes) */}
      {uploading > 0 && (
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-xs text-[var(--color-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-brand)]" />
          <span>
            {uploading} upload{uploading !== 1 ? "s" : ""} in progress — please wait before submitting.
          </span>
        </div>
      )}

      {/* Photo limit notice (guided/batch modes) */}
      {mode !== "rapid" && limitNotice && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-amber)] bg-[var(--color-elevated)] px-3 py-2 text-xs text-[var(--color-amber)]">
          {limitNotice}
        </div>
      )}

      {/* Hidden file inputs for guided/batch modes */}
      {ALL_SHOTS.map((s) => (
        <input
          key={s.area}
          ref={(el) => {
            guidedInputRefs.current[s.area] = el;
          }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleGuidedInputChange(s.area, e)}
        />
      ))}
    </div>
  );
}
