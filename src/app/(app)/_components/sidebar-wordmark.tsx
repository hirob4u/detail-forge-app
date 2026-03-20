import Link from "next/link";
import Wordmark from "@/components/wordmark";

// Sidebar wordmark -- always DetailForge, never org logo
export default function SidebarWordmark() {
  return (
    <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
      <Wordmark className="text-2xl text-[var(--color-text)]" />
    </Link>
  );
}
