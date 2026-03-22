"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-client";
import Wordmark from "@/components/wordmark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Always show success to prevent email enumeration.
      // The server sends fire-and-forget to prevent timing attacks.
      await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSubmitted(true);
    } catch {
      // Network errors are the only case we surface — they don't
      // reveal account existence.
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1>
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Wordmark className="text-3xl text-[var(--color-text)]" />
          </Link>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Reset your password
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        {submitted ? (
          <div className="text-center">
            <p className="text-sm text-[var(--color-text)]">
              If an account exists with that email, you&apos;ll receive a
              password reset link shortly.
            </p>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Check your spam folder if you don&apos;t see it within a few
              minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="mb-4 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <p className="mb-4 text-sm text-[var(--color-muted)]">
              Enter the email address associated with your account and
              we&apos;ll send you a link to reset your password.
            </p>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}

        <Link
          href="/sign-in"
          className="mt-4 flex items-center justify-center gap-1.5 text-sm text-[var(--color-purple-text)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
