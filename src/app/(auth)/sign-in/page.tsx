"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CircleCheck } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import Wordmark from "@/components/wordmark";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message ?? "Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1>
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <Wordmark className="text-3xl text-[var(--color-text)]" />
          </Link>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Sign in to your account
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        {resetSuccess && (
          <p className="mb-4 flex items-center gap-2 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-green)]">
            <CircleCheck className="h-4 w-4 shrink-0" />
            Password reset successfully. Sign in with your new password.
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-[var(--radius-badge)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-4">
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

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--color-text)]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--color-purple-text)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="Enter your password"
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
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-[var(--color-purple-text)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
