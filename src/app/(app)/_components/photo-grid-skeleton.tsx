export default function PhotoGridSkeleton({
  count = 8,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)]"
        >
          <div className="h-5 w-5 rounded-[var(--radius-badge)] border-2 border-[var(--color-border)] border-t-[var(--color-purple-action)] animate-spin" />
        </div>
      ))}
    </div>
  );
}
