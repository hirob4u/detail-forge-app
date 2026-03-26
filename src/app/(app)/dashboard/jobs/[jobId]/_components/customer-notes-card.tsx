// ---------------------------------------------------------------------------
// CustomerNotesCard — read-only display of the customer's intake notes
// ---------------------------------------------------------------------------

interface CustomerNotesCardProps {
  notes: string;
}

export default function CustomerNotesCard({ notes }: CustomerNotesCardProps) {
  if (!notes.trim()) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p
        className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Customer notes
      </p>
      <p className="text-sm italic leading-relaxed text-[var(--color-text)]">
        <span className="text-[var(--color-muted)]">&ldquo;</span>
        {notes}
        <span className="text-[var(--color-muted)]">&rdquo;</span>
      </p>
    </div>
  );
}
