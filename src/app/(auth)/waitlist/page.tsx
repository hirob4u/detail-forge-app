import Wordmark from "@/components/wordmark";

export default function WaitlistPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1>
          <a href="https://detailforge.io">
            <Wordmark className="text-3xl text-[var(--color-text)]" />
          </a>
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
          <a
            href="mailto:hello@detailforge.io?subject=Request%20Access%20to%20DetailForge&body=Hi%20DetailForge%20team%2C%0A%0AI%27d%20like%20to%20request%20early%20access.%0A%0AShop%20Name%3A%20%0AHow%20I%20heard%20about%20DetailForge%3A%20%0A%0AThanks!"
            className="text-[var(--color-purple-text)]"
          >
            hello@detailforge.io
          </a>{" "}
          to request access and we will be in touch.
        </p>
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Have an invite link? Use the link sent to you directly to get started.
        </p>
      </div>
    </div>
  );
}
