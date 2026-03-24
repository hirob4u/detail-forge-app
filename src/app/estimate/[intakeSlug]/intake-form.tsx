"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { maskPhone, stripPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import StructuredPhotoCapture, {
  type ShotArea,
} from "./structured-photo-capture";
import StepIndicator from "./step-indicator";
import IntentTiles from "./intent-tiles";

interface IntakeFormProps {
  orgSlug: string;
  orgName: string;
}

export default function IntakeForm({ orgSlug, orgName }: IntakeFormProps) {
  const router = useRouter();
  const submitRef = useRef<HTMLButtonElement>(null);

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Contact + Vehicle
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");

  // Step 2: Intent + Notes
  const [intents, setIntents] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Step 3: Photos
  const [photos, setPhotos] = useState<
    Array<{ key: string; area: ShotArea; phase: "before" }>
  >([]);

  // Form state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [contactError, setContactError] = useState("");

  /* ---- Step 1 validation ---- */

  function validateStep1(): boolean {
    setContactError("");
    setError("");

    if (!firstName.trim()) {
      setError("First name is required.");
      return false;
    }

    // Email or phone required
    const hasEmail = email.trim().length > 0;
    const hasPhone = (stripPhone(phone)?.length ?? 0) > 0;

    if (!hasEmail && !hasPhone) {
      setContactError("Please provide an email or phone number.");
      return false;
    }

    // Email format check if provided
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setContactError("Please enter a valid email address.");
      return false;
    }

    // Vehicle fields
    if (!vehicleYear.trim() || !vehicleMake.trim() || !vehicleModel.trim() || !vehicleColor.trim()) {
      setError("Please fill in all vehicle fields.");
      return false;
    }

    const yearNum = parseInt(vehicleYear, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
      setError("Please enter a valid year.");
      return false;
    }

    return true;
  }

  function handleNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  function handleBack() {
    setError("");
    setContactError("");
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  /* ---- Submit ---- */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const yearNum = parseInt(vehicleYear, 10);

    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: stripPhone(phone),
          vehicleYear: yearNum,
          vehicleMake: vehicleMake.trim(),
          vehicleModel: vehicleModel.trim(),
          vehicleColor: vehicleColor.trim(),
          notes: notes.trim(),
          intents,
          photoKeys: photos,
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

  /* ---- Shared styles ---- */

  const inputClass =
    "w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:outline-none";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-[var(--color-text)]";

  const legendClass =
    "mb-4 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]";

  const primaryBtnClass =
    "flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-6 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-brand-hover)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed";

  const secondaryBtnClass =
    "flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] hover:border-[var(--color-brand)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      <StepIndicator
        current={step}
        onNavigate={(s) => {
          setError("");
          setContactError("");
          setStep(s);
        }}
      />

      {error && (
        <p className="mb-4 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      {/* ============================================================ */}
      {/*  STEP 1 — Your vehicle                                       */}
      {/* ============================================================ */}
      {step === 1 && (
        <div>
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
                    Last name <span className="text-[var(--color-muted)]">(optional)</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {contactError && (
                <p className="rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-xs text-[var(--color-destructive)]">
                  {contactError}
                </p>
              )}

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="text"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="jane@example.com"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  We&apos;ll use this to send your estimate
                </p>
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  className={inputClass}
                  placeholder="(555) 123-4567"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Whichever you prefer — we&apos;ll use this to reach you
                </p>
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

          {/* Next button */}
          <div className="flex justify-end">
            <button type="button" onClick={handleNext} className={primaryBtnClass}>
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 2 — What you're looking for                            */}
      {/* ============================================================ */}
      {step === 2 && (
        <div>
          <fieldset className="mb-6">
            <legend
              className={legendClass}
              style={{ fontFamily: "var(--font-data)" }}
            >
              What are you looking for?
            </legend>
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              Select all that apply — or skip this step entirely.
            </p>
            <IntentTiles selected={intents} onChange={setIntents} />
          </fieldset>

          <fieldset className="mb-6">
            <legend
              className={legendClass}
              style={{ fontFamily: "var(--font-data)" }}
            >
              Anything specific to mention?
            </legend>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Pet hair, smoke smell, deep stain on back seat..."
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Optional — even a few words help the detailer prepare
            </p>
          </fieldset>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBack} className={secondaryBtnClass}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button type="button" onClick={handleNext} className={primaryBtnClass}>
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  STEP 3 — Photos (optional)                                  */}
      {/* ============================================================ */}
      {step === 3 && (
        <div>
          <fieldset className="mb-6">
            <legend
              className={legendClass}
              style={{ fontFamily: "var(--font-data)" }}
            >
              Vehicle Photos{" "}
              <span className="normal-case tracking-normal text-[var(--color-muted)]">
                (optional)
              </span>
            </legend>
            <StructuredPhotoCapture
              orgSlug={orgSlug}
              onPhotosChange={setPhotos}
              submitRef={submitRef}
            />
          </fieldset>

          {/* Navigation + Submit */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBack} className={secondaryBtnClass}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              ref={submitRef}
              type="submit"
              disabled={loading}
              className={cn(primaryBtnClass, "flex-1 ml-3")}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Estimate"
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            By submitting, you agree to be contacted by {orgName} regarding your
            estimate.
          </p>
        </div>
      )}
    </form>
  );
}
