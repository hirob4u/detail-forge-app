"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Your vehicle" },
  { number: 2, label: "What you need" },
  { number: 3, label: "Photos" },
] as const;

interface StepIndicatorProps {
  current: 1 | 2 | 3;
  onNavigate: (step: 1 | 2 | 3) => void;
}

export default function StepIndicator({
  current,
  onNavigate,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Form steps" className="mb-6">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, i) => {
          const isActive = step.number === current;
          const isCompleted = step.number < current;
          const isPending = step.number > current;
          const canNavigate = isCompleted;

          return (
            <li key={step.number} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => canNavigate && onNavigate(step.number as 1 | 2 | 3)}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-button)] px-2 py-1 text-xs font-medium transition-colors",
                  canNavigate && "cursor-pointer hover:bg-[var(--color-hover)]",
                  !canNavigate && "cursor-default",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step dot */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors",
                    isActive &&
                      "bg-[var(--color-brand)] text-white",
                    isCompleted &&
                      "bg-[var(--color-brand)] text-white",
                    isPending &&
                      "border border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-muted)]",
                  )}
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.number
                  )}
                </span>

                {/* Step label — hidden on smallest screens */}
                <span
                  className={cn(
                    "hidden text-xs sm:inline",
                    isActive && "text-[var(--color-text)]",
                    isCompleted && "text-[var(--color-muted)]",
                    isPending && "text-[var(--color-muted)]",
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    step.number < current
                      ? "bg-[var(--color-brand)]"
                      : "bg-[var(--color-border)]",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
