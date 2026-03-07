"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PhotoThumbnail({
  src,
  alt,
  label,
  onClick,
  loading: externalLoading,
  className,
}: {
  src?: string | null;
  alt: string;
  label: string;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  const showSpinner = externalLoading || (!!src && !imageLoaded && !error);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!src || !!externalLoading}
      className={`group relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] transition-colors disabled:cursor-default ${
        src && !externalLoading
          ? "hover:border-[var(--color-purple-action)]/50"
          : ""
      } ${className ?? ""}`}
    >
      {/* Spinner shown while loading or while image is fetching */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Failed
          </p>
        </div>
      )}

      {/* Image -- invisible until loaded, fades in */}
      {src && !error && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setImageLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Label -- ALWAYS visible regardless of load state */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <p
          className="truncate text-[10px] uppercase tracking-widest text-white"
          style={{ fontFamily: "var(--font-data)" }}
        >
          {label}
        </p>
      </div>
    </button>
  );
}
