import Link from "next/link";
import Wordmark from "@/components/wordmark";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-background)] px-6">
      {/* Hero */}
      <div className="flex flex-col items-center gap-8 text-center">
        <Wordmark className="text-4xl sm:text-6xl md:text-8xl text-[var(--color-text)]" />

        <p className="text-base tracking-wide text-[var(--color-muted)]">
          Is your business forged through details?
        </p>

        <Link
          href="/sign-in"
          className="rounded-[var(--radius-button)] bg-[var(--color-brand,var(--color-purple-action))] px-8 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:brightness-110"
        >
          Sign In
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-[var(--color-muted)] opacity-50">
        &copy; {new Date().getFullYear()} Foranware
      </footer>
    </div>
  );
}
