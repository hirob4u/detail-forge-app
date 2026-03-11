// Sidebar wordmark -- always DetailForge, never org logo
export default function SidebarWordmark() {
  return (
    <span
      className="text-lg tracking-wide text-[var(--color-text)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      Detail<span className="text-[var(--color-purple-action)]">Forge</span>
    </span>
  );
}
