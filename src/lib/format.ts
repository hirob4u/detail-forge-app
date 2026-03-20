/**
 * Phone number formatting utilities.
 *
 * Strips all non-digit characters, then formats as (xxx) xxx-xxxx
 * for 10-digit US numbers or +x (xxx) xxx-xxxx for 11-digit (with
 * leading country code). Returns the raw digits for other lengths.
 */

/** Strip a phone string down to pure digits. */
export function stripPhone(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Format a digit string into (xxx) xxx-xxxx display format.
 * Returns the original value untouched if it doesn't look like
 * a 10- or 11-digit US number.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = stripPhone(value);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 11 digits starting with 1 → +1 (xxx) xxx-xxxx
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Non-US or partial — return as-is
  return value;
}

/**
 * Live input mask for phone fields. Call this from onChange handlers
 * to progressively format as the user types.
 *
 * Typing flow:
 *   5        → (5
 *   55       → (55
 *   555      → (555)
 *   5551     → (555) 1
 *   555123   → (555) 123-
 *   5551234  → (555) 123-4
 *   5551234567 → (555) 123-4567
 */
export function maskPhone(value: string): string {
  let digits = stripPhone(value);
  // Strip leading country code 1 so users who type it still get correct mask
  if (digits.length > 10 && digits[0] === "1") {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6)
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
