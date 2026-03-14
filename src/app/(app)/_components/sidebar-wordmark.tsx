import Link from "next/link";

// Sidebar wordmark -- always DetailForge, never org logo
export default function SidebarWordmark() {
  return (
    <Link href="/dashboard">
      <span
        className="text-2xl tracking-wide text-[var(--color-text)] hover:opacity-80 transition-opacity"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Detail<span className="text-[var(--color-purple-action)]">Forge</span>
      </span>
    </Link>
  );
}
