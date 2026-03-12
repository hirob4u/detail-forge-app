"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { X, Loader2, Check } from "lucide-react";

interface OrgData {
  id: string;
  name: string;
  slug: string;
  businessEmail: string;
  phone: string;
  website: string | null;
  city: string;
  state: string;
  shopName: string | null;
  shopTagline: string | null;
  logoKey: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  nameFont: string | null;
}

const FONTS = [
  { value: "DM Sans" },
  { value: "Inter" },
  { value: "Syne" },
  { value: "Barlow" },
  { value: "Oswald" },
  { value: "Bebas Neue" },
  { value: "Montserrat" },
] as const;

const ALLOWED_FONT_NAMES: Set<string> = new Set(FONTS.map((f) => f.value));

const ACCENT_COLORS = [
  { hex: "#7C4DFF", label: "Purple" },
  { hex: "#9575FF", label: "Soft Purple" },
  { hex: "#E040FB", label: "Magenta" },
  { hex: "#00E5FF", label: "Cyan" },
  { hex: "#39FF14", label: "Green" },
  { hex: "#FFAB00", label: "Amber" },
  { hex: "#FF5252", label: "Red" },
] as const;

const ALLOWED_HEXES: Set<string> = new Set(ACCENT_COLORS.map((c) => c.hex));

export default function BrandingForm({ org }: { org: OrgData }) {
  // Business profile fields
  const [name, setName] = useState(org.name);
  const [businessEmail, setBusinessEmail] = useState(org.businessEmail);
  const [phone, setPhone] = useState(org.phone);
  const [website, setWebsite] = useState(org.website ?? "");
  const [city, setCity] = useState(org.city);
  const [state, setState] = useState(org.state);

  // Branding fields
  const [shopName, setShopName] = useState(org.shopName ?? "");
  const [shopTagline, setShopTagline] = useState(org.shopTagline ?? "");
  const [accentColor, setAccentColor] = useState(
    org.accentColor && ALLOWED_HEXES.has(org.accentColor)
      ? org.accentColor
      : "#7C4DFF",
  );
  const [nameFont, setNameFont] = useState(
    org.nameFont && ALLOWED_FONT_NAMES.has(org.nameFont) ? org.nameFont : "DM Sans",
  );

  // Logo state
  const [logoKey, setLogoKey] = useState(org.logoKey);
  const [logoUrl, setLogoUrl] = useState(org.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load Google Fonts so swatch cards render in actual typeface
  useEffect(() => {
    const fonts = [
      "DM+Sans",
      "Inter",
      "Syne",
      "Barlow",
      "Oswald",
      "Bebas+Neue",
      "Montserrat",
    ];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f}:wght@400;600`).join("&")}&display=swap`;
    document.head.appendChild(link);
  }, []);

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    setError("");

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/org/logo-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { presignedUrl, key } = await presignRes.json();

      // Upload to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload logo");
      }

      // Set local preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setLogoKey(key);
      setLogoUrl(null); // Will be set by server on save
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  function handleLogoRemove() {
    setLogoKey(null);
    setLogoUrl(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/org/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessEmail,
          phone,
          website: website || undefined,
          city,
          state,
          shopName: shopName || null,
          shopTagline: shopTagline || null,
          logoKey,
          accentColor,
          nameFont,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      const updated = await res.json();

      // Update logoUrl from server response
      if (updated.logoUrl) {
        setLogoUrl(updated.logoUrl);
      }

      // Clean up preview
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const logoDisplayUrl = logoPreview || logoUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Section 1: Business Profile */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <legend
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Business Profile
        </legend>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Organization Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="businessEmail"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
              >
                Business Email
              </label>
              <input
                id="businessEmail"
                type="email"
                required
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="website"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Website
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="https://yourbusiness.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="city"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
              >
                State
              </label>
              <input
                id="state"
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Shop Name & Tagline */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <legend
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Customer-Facing Branding
        </legend>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="shopName"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Shop Name
            </label>
            <p className="mb-1.5 text-xs text-[var(--color-muted)]">
              Displayed on the intake form and customer-facing pages
            </p>
            <input
              id="shopName"
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder={org.name}
            />
          </div>

          <div>
            <label
              htmlFor="shopTagline"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Tagline
            </label>
            <input
              id="shopTagline"
              type="text"
              value={shopTagline}
              onChange={(e) => setShopTagline(e.target.value)}
              maxLength={120}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="Premium auto detailing services"
            />
            <p
              className="mt-1 text-right text-xs text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {shopTagline.length}/120
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Logo Upload */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <legend
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Logo
        </legend>

        <div className="flex items-start gap-4">
          {/* Logo preview */}
          <div className="shrink-0">
            {logoDisplayUrl ? (
              <div className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoDisplayUrl}
                  alt="Shop logo"
                  className="h-20 w-auto max-w-[240px] object-contain"
                />
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="absolute -right-1 -top-1 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                </button>
              </div>
            ) : logoUploading ? (
              <div className="flex h-20 w-40 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)]">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
              </div>
            ) : (
              <div className="flex h-20 w-40 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-muted)]">No logo uploaded</p>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-[var(--color-text)]">
              {logoDisplayUrl ? "Logo uploaded" : "Upload your shop logo"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              JPEG, PNG, or WebP. Displayed on the estimates page header.
            </p>
            {!logoDisplayUrl && !logoUploading && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="mt-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-hover)]"
              >
                Choose file
              </button>
            )}
          </div>
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Section 4: Accent Color & Font */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <legend
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-data)" }}
        >
          Theme
        </legend>

        <div className="space-y-4">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Accent Color
            </label>
            <p className="mb-1.5 text-xs text-[var(--color-muted)]">
              Used for buttons and highlights on the intake form
            </p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setAccentColor(color.hex)}
                  title={color.label}
                  className={`h-9 w-9 rounded-[var(--radius-button)] border-2 transition-transform hover:scale-105 ${
                    accentColor === color.hex
                      ? "border-white scale-110"
                      : "border-[var(--color-border)] hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          {/* Font picker -- compact swatches matching color picker layout */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Shop Name Font
            </label>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Applied to your shop name on the estimates page
            </p>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((font) => {
                const isSelected = nameFont === font.value;
                return (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => setNameFont(font.value)}
                    title={font.value}
                    className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] border-2 bg-[var(--color-elevated)] transition-transform hover:scale-105 ${
                      isSelected
                        ? "border-white scale-110"
                        : "border-[var(--color-border)] hover:scale-105"
                    }`}
                  >
                    <span
                      style={{ fontFamily: `'${font.value}', sans-serif` }}
                      className="text-base font-semibold text-[var(--color-text)] select-none"
                    >
                      Df
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live preview -- shop name in selected font + accent color */}
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-5 py-4">
              <p
                className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                Preview
              </p>
              <span
                style={{
                  fontFamily: `'${nameFont}', sans-serif`,
                  color: accentColor,
                }}
                className="text-2xl font-semibold leading-tight"
              >
                {shopName || org.name || "Your Shop"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-6 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {success && (
          <span className="flex items-center gap-1 text-sm text-[var(--color-green)]">
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
