import { STAGE_LABELS } from "@/lib/stage-transitions";
import { formatDistanceToNow } from "date-fns";

type HistoryEntry = {
  from: string;
  to: string;
  at: string;
  note?: string;
};

export default function StageHistory({
  history,
}: {
  history: HistoryEntry[];
}) {
  if (!history || history.length === 0) {
    return (
      <p className="text-xs text-[var(--color-muted)]">
        No stage history yet.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {[...history].reverse().map((entry, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-purple-action)]" />
          <div>
            <p className="text-sm text-[var(--color-text)]">
              <span className="text-[var(--color-muted)]">
                {STAGE_LABELS[
                  entry.from as keyof typeof STAGE_LABELS
                ] ?? entry.from}
              </span>
              {" → "}
              <span className="font-medium">
                {STAGE_LABELS[
                  entry.to as keyof typeof STAGE_LABELS
                ] ?? entry.to}
              </span>
            </p>
            {entry.note && (
              <p className="text-xs text-[var(--color-muted)]">
                {entry.note}
              </p>
            )}
            <p
              className="text-[10px] text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {formatDistanceToNow(new Date(entry.at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
