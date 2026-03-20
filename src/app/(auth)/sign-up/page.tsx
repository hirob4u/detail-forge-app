"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Wordmark from "@/components/wordmark";
import { Loader2, CircleCheck } from "lucide-react";
import { signUp, organization } from "@/lib/auth-client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Invite code state
  const [inviteCode, setInviteCode] = useState(
    searchParams.get("code")?.toUpperCase() ?? "",
  );
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [validating, setValidating] = useState(false);

  // Auto-validate invite code on mount when present in URL
  useEffect(() => {
    if (inviteCode) {
      handleValidateCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount only
  }, []);

  async function handleValidateCode() {
    if (!inviteCode) return;
    setValidating(true);
    setInviteError("");

    const res = await fetch("/api/invites/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode, email }),
    });
    const data = await res.json();

    if (data.valid) {
      setInviteValid(true);
    } else {
      setInviteValid(false);
      setInviteError(data.error ?? "Invalid invite code");
    }
    setValidating(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!inviteValid) {
      setError("Please verify your invite code before creating an account.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed. Please try again.");
      setLoading(false);
      return;
    }

    const slug = slugify(businessName);
    const { data: orgData, error: orgError } = await organization.create({
      name: businessName,
      slug,
    });

    if (orgError || !orgData) {
      setError(orgError?.message ?? "Failed to create organization.");
      setLoading(false);
      return;
    }

    // Create the DetailForge organization record linked to the Better Auth org
    const dfOrgRes = await fetch("/api/org/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betterAuthOrgId: orgData.id,
        name: businessName,
        slug,
        inviteCode,
        email,
      }),
    });

    if (!dfOrgRes.ok) {
      setError("Failed to set up your organization. Please contact support.");
      setLoading(false);
      return;
    }

    const { error: activeError } = await organization.setActive({
      organizationId: orgData.id,
    });

    if (activeError) {
      setError(activeError.message ?? "Failed to activate organization.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1>
          <Wordmark className="text-3xl text-[var(--color-text)]" />
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Create your account
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
          {/* Invite Code */}
          <div>
            <label
              htmlFor="inviteCode"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Invite Code
            </label>
            <div className="flex gap-2">
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setInviteValid(false);
                  setInviteError("");
                }}
                className="flex-1 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm uppercase text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
                style={{ fontFamily: "var(--font-data)" }}
                placeholder="XXXX-XXXX"
                maxLength={20}
              />
              <button
                type="button"
                onClick={handleValidateCode}
                disabled={!inviteCode || validating}
                className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-hover)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
              >
                {validating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </button>
            </div>
            {inviteError && (
              <p className="mt-1 text-xs text-destructive">{inviteError}</p>
            )}
            {inviteValid && !inviteError && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-green)]">
                <CircleCheck className="h-3 w-3" />
                Invite code accepted
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="Jane Smith"
            />
          </div>

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
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="businessName"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
            >
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-purple-action)] focus:outline-none"
              placeholder="Acme Detailing"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[var(--color-purple-text)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function SignUpFormFallback() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1>
          <Wordmark className="text-3xl text-[var(--color-text)]" />
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Create your account
        </p>
      </div>
      <div className="flex min-h-[300px] items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-purple-action)]" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFormFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
