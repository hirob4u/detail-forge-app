"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ApproveButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/quote/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Failed to approve quote" }));
        throw new Error(data.error ?? "Failed to approve quote");
      }

      router.push(`/quote/${token}/approved`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to approve quote";
      setError(message);
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )}
        {pending ? "Approving..." : "Approve Quote"}
      </button>

      {error && (
        <p className="text-center text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
