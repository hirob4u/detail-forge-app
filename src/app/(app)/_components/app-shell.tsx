"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/supplies", label: "Supplies", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({
  children,
  wordmark,
  userSlot,
}: Readonly<{
  children: ReactNode;
  wordmark: ReactNode;
  userSlot: ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-dvh bg-[var(--color-background)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSidebarOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Wordmark */}
        <div className="flex h-16 items-center px-6">
          {wordmark}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-elevated)] text-[var(--color-purple-text)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User panel */}
        {userSlot}
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile header with hamburger */}
        <header className="flex h-16 items-center border-b border-[var(--color-border)] px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-[var(--radius-button)] p-2 text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <div className="ml-3">{wordmark}</div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
