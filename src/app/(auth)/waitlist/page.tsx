import Link from "next/link";

export default function WaitlistPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-purple-text)]">
          DetailForge
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Early Access</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">
          DetailForge is currently invite-only
        </p>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          We are onboarding a small group of detailers during our early access
          period. If you are interested in joining, reach out and we will be in
          touch.
        </p>
        <a
          href="mailto:hello@detailforge.io"
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-purple-deep)]"
        >
          Request Access
        </a>
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Already have an invite code?{" "}
          <Link
            href="/sign-up"
            className="text-[var(--color-purple-text)] hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
