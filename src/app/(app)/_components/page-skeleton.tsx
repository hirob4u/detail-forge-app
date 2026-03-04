import { Loader2 } from "lucide-react";

export default function PageSkeleton() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-purple-action)]" />
      <p
        className="text-xs uppercase tracking-widest text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Loading...
      </p>
    </div>
  );
}
