import { Suspense } from "react";
import AppShell from "./_components/app-shell";
import SidebarWordmark from "./_components/sidebar-wordmark";
import SidebarUser from "./_components/sidebar-user";

const wordmarkFallback = (
  <span className="text-xl font-bold text-[var(--color-purple-text)]">
    DetailForge
  </span>
);

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell
      wordmark={
        <Suspense fallback={wordmarkFallback}>
          <SidebarWordmark />
        </Suspense>
      }
      userSlot={
        <Suspense fallback={null}>
          <SidebarUser />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
