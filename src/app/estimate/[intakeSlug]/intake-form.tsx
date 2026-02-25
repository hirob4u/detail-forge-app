"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PhotoUploader from "./photo-uploader";

interface IntakeFormProps {
  orgSlug: string;
  orgName: string;
}

export default function IntakeForm({ orgSlug, orgName }: IntakeFormProps) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const yearNum = parseInt(vehicleYear, 10);
    if (isNaN(yearNum)) {
      setError("Please enter a valid year.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          firstName,
          lastName,
          email,
          phone,
          vehicleYear: yearNum,
          vehicleMake,
          vehicleModel,
          vehicleColor,
          notes,
          photoUrls,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      router.push(`/estimate/${orgSlug}/confirmation`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Submission failed. Please try again.",
      );
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--color-text)]";

  const legendClass =
    "mb-4 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      {error && (
        <p className="mb-4 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Contact Info */}
      <fieldset className="mb-6">
        <legend
          className={legendClass}
          style={{ fontFamily: "var(--font-data)" }}
        >
          Contact Information
        </legend>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className={labelClass}>
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                placeholder="Jane"
              />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </fieldset>

      {/* Vehicle Info */}
      <fieldset className="mb-6">
        <legend
          className={legendClass}
          style={{ fontFamily: "var(--font-data)" }}
        >
          Vehicle Information
        </legend>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vehicleYear" className={labelClass}>
                Year
              </label>
              <input
                id="vehicleYear"
                inputMode="numeric"
                required
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
                className={inputClass}
                style={{ fontFamily: "var(--font-data)" }}
                placeholder="2024"
                maxLength={4}
              />
            </div>
            <div>
              <label htmlFor="vehicleColor" className={labelClass}>
                Color
              </label>
              <input
                id="vehicleColor"
                type="text"
                required
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                className={inputClass}
                placeholder="Black"
              />
            </div>
          </div>
          <div>
            <label htmlFor="vehicleMake" className={labelClass}>
              Make
            </label>
            <input
              id="vehicleMake"
              type="text"
              required
              value={vehicleMake}
              onChange={(e) => setVehicleMake(e.target.value)}
              className={inputClass}
              placeholder="Tesla"
            />
          </div>
          <div>
            <label htmlFor="vehicleModel" className={labelClass}>
              Model
            </label>
            <input
              id="vehicleModel"
              type="text"
              required
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className={inputClass}
              placeholder="Model 3"
            />
          </div>
        </div>
      </fieldset>

      {/* Photos */}
      <fieldset className="mb-6">
        <legend
          className={legendClass}
          style={{ fontFamily: "var(--font-data)" }}
        >
          Vehicle Photos
        </legend>
        <PhotoUploader orgSlug={orgSlug} onPhotosChange={setPhotoUrls} />
      </fieldset>

      {/* Notes */}
      <fieldset className="mb-6">
        <legend
          className={legendClass}
          style={{ fontFamily: "var(--font-data)" }}
        >
          Additional Notes
        </legend>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Any specific concerns or services you're interested in..."
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-purple-deep)] disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Request Estimate"}
      </button>

      <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
        By submitting, you agree to be contacted by {orgName} regarding your
        estimate.
      </p>
    </form>
  );
}
