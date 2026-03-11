import { Suspense } from "react";
import AppShell from "./_components/app-shell";
import SidebarWordmark from "./_components/sidebar-wordmark";
import SidebarUser from "./_components/sidebar-user";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell
      wordmark={<SidebarWordmark />}
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
