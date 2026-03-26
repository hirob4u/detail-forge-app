import type { ConditionFlag, FlagSeverity } from "@/lib/types/assessment";

const VALID_SEVERITIES = new Set<FlagSeverity>([
  "moderate",
  "noted",
  "clear",
  "upsell",
]);

/**
 * Normalize a flags array that may contain legacy plain strings
 * (from assessments created before structured flags) into the
 * canonical `ConditionFlag[]` shape.
 *
 * - A plain string becomes `{ severity: "noted", title: "Flag N", description: string }`.
 * - An object with valid severity/title/description passes through.
 * - Anything else is coerced to a best-effort "noted" flag.
 */
export function normalizeFlags(flags: unknown): ConditionFlag[] {
  if (!Array.isArray(flags)) return [];

  return flags.map((flag, i): ConditionFlag => {
    // Legacy format: plain string
    if (typeof flag === "string") {
      return {
        severity: "noted",
        title: `Flag ${i + 1}`,
        description: flag,
      };
    }

    // Structured format: validate shape
    if (
      flag !== null &&
      typeof flag === "object" &&
      "severity" in flag &&
      "title" in flag &&
      "description" in flag
    ) {
      const obj = flag as Record<string, unknown>;
      return {
        severity: VALID_SEVERITIES.has(obj.severity as FlagSeverity)
          ? (obj.severity as FlagSeverity)
          : "noted",
        title: typeof obj.title === "string" ? obj.title : `Flag ${i + 1}`,
        description:
          typeof obj.description === "string" ? obj.description : "",
      };
    }

    // Unrecognized shape — best effort
    return {
      severity: "noted",
      title: `Flag ${i + 1}`,
      description: String(flag),
    };
  });
}
