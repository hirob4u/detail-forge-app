import Wordmark from "@/components/wordmark";

export default function WaitlistPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1>
          <Wordmark className="text-3xl text-[var(--color-text)]" />
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Early Access</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">
          DetailForge is currently invite-only
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          We are onboarding a small group of detailers during our early access
          period. Reach out to us at{" "}
          <span className="text-[var(--color-purple-text)]">
            hello@detailforge.io
          </span>{" "}
          to request access and we will be in touch.
        </p>
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Have an invite link? Use the link sent to you directly to get started.
        </p>
      </div>
    </div>
  );
}
