"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default function SidebarUserClient({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <div className="border-t border-[var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-badge)] bg-[var(--color-purple-deep)] text-xs font-bold text-[var(--color-purple-text)]">
          {getInitials(name)}
        </div>

        {/* Name and email */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text)]">
            {name}
          </p>
          <p className="truncate text-xs text-[var(--color-muted)]">{email}</p>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out"
          className="flex-shrink-0 rounded-[var(--radius-button)] p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] disabled:opacity-40"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
