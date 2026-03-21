"use client";

import { useState, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="flex items-center p-4">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            {title}
          </span>
          {count !== undefined && (
            <span
              className="rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {count}
            </span>
          )}
        </button>
      </header>

      <div
        id={panelId}
        role="region"
        aria-hidden={!open}
        // @ts-expect-error -- inert is a valid HTML attribute, React types lag
        inert={!open ? "" : undefined}
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
