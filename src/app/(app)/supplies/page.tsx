import { Package } from "lucide-react";

export default function SuppliesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Package className="mb-4 h-10 w-10 text-[var(--color-muted)]" />
      <p className="text-sm font-semibold text-[var(--color-text)]">
        Supply Tracking
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Track product costs per job. Coming in a future update.
      </p>
    </div>
  );
}
