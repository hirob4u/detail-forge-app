/**
 * Canonical types for AI condition assessments.
 *
 * These replace the ad-hoc interfaces previously duplicated in
 * `review-form.tsx` and `analyze/route.ts`.
 */

import type { AiBriefing } from "@/lib/types/ai";

// ---------------------------------------------------------------------------
// Structured flag — replaces the legacy `string[]` format
// ---------------------------------------------------------------------------

export type FlagSeverity = "moderate" | "noted" | "clear" | "upsell";

export interface ConditionFlag {
  /** Severity level that drives badge color and ordering. */
  severity: FlagSeverity;
  /** Short human-readable title, 2-4 words (e.g. "Swirl marks"). */
  title: string;
  /** Actionable detail for the detailer. */
  description: string;
}

// ---------------------------------------------------------------------------
// Vehicle verification
// ---------------------------------------------------------------------------

export interface VehicleVerification {
  appearsToMatch: boolean;
  observedVehicle: string;
  submittedVehicle: string;
  mismatchNote: string | null;
}

// ---------------------------------------------------------------------------
// Score dimension
// ---------------------------------------------------------------------------

export interface ScoreDimension {
  score: number | null;
  description: string;
  recommendedService: string;
}

// ---------------------------------------------------------------------------
// Recommended service (pre-quote AI suggestion)
// ---------------------------------------------------------------------------

export interface RecommendedService {
  name: string;
  note?: string;
  basePrice: number;
  adjustedPrice: number;
}

// ---------------------------------------------------------------------------
// Full condition assessment (stored in jobs.aiAssessment JSONB)
// ---------------------------------------------------------------------------

export interface ConditionAssessment {
  briefing?: AiBriefing;
  vehicleVerification?: VehicleVerification;
  scores: Record<string, ScoreDimension>;
  recommendedServices: RecommendedService[];
  requiresInPersonVerification?: string[];
  confidence: number;
  flags: ConditionFlag[];
}
