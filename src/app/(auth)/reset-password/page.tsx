"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/auth-client";
import Wordmark from "@/components/wordmark";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
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
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-sm text-[var(--color-text)]">
            Invalid or missing reset link.
          </p>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Please request a new password reset.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-[var(--color-purple-text)] hover:underline"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    try {
      const { error: resetError } = await resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(
          resetError.message ?? "Reset failed. The link may have expired.",
        );
        setLoading(false);
        return;
      }

      router.push("/sign-in?reset=success");
    } catch {
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
          Choose a new password
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        {error && (
          <p className="mb-4 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting...
            </span>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </div>
  );
}
