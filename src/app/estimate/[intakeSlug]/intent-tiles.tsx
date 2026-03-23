"use client";

import {
  Droplets,
  Armchair,
  Paintbrush,
  Shield,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentOption {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "wash",
    label: "Wash & basic clean",
    description: "Exterior wash and light interior wipe-down",
    Icon: Droplets,
  },
  {
    id: "interior",
    label: "Deep interior clean",
    description: "Seats, carpet, dash — the full treatment",
    Icon: Armchair,
  },
  {
    id: "paint",
    label: "Scratch or paint issues",
    description: "Swirls, scratches, oxidation, or paint damage",
    Icon: Paintbrush,
  },
  {
    id: "protection",
    label: "Long-term protection",
    description: "Ceramic coating, PPF, or paint sealant",
    Icon: Shield,
  },
  {
    id: "unsure",
    label: "Not sure yet",
    description: "I'd like a recommendation",
    Icon: HelpCircle,
  },
];

interface IntentTilesProps {
  selected: string[];
  onChange: (intents: string[]) => void;
}

export default function IntentTiles({ selected, onChange }: IntentTilesProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div
      className="grid grid-cols-2 gap-3"
      role="group"
      aria-label="What are you looking for?"
    >
      {INTENT_OPTIONS.map(({ id, label, description, Icon }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggle(id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-[var(--radius-card)] border p-4 text-center transition-colors",
              isSelected
                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-hover)]",
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6 transition-colors",
                isSelected
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-muted)]",
              )}
            />
            <span className="text-sm font-medium">{label}</span>
            <span className="text-[11px] leading-tight text-[var(--color-muted)]">
              {description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
