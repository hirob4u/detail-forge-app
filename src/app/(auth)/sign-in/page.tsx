"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message ?? "Sign in failed. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-purple-text)]">
          DetailForge
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Sign in to your account
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
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-purple-deep)] disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
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
