import { STAGE_LABELS } from "@/lib/stage-transitions";
import { STAGE_CONFIG } from "@/app/(app)/_components/stage-config";
import { formatDistanceToNow } from "date-fns";

type HistoryEntry = {
  from: string;
  to: string;
  at: string;
  note?: string;
};

function stageColor(stage: string): string {
  return STAGE_CONFIG[stage]?.color ?? "text-[var(--color-muted)]";
}

function safeTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Unknown time";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Unknown time";
  }
}

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
      {[...history].reverse().map((entry) => (
        <li
          key={`${entry.from}-${entry.to}-${entry.at}`}
          className="flex items-start gap-3"
        >
          <div
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-[var(--radius-badge)] ${STAGE_CONFIG[entry.to]?.bg ?? "bg-[var(--color-muted)]/10"}`}
          />
          <div>
            <p className="text-sm text-[var(--color-text)]">
              <span className={stageColor(entry.from)}>
                {STAGE_LABELS[
                  entry.from as keyof typeof STAGE_LABELS
                ] ?? entry.from}
              </span>
              {" → "}
              <span className={`font-medium ${stageColor(entry.to)}`}>
                {STAGE_LABELS[
                  entry.to as keyof typeof STAGE_LABELS
                ] ?? entry.to}
              </span>
            </p>
            {entry.note && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)] italic">
                &ldquo;{entry.note}&rdquo;
              </p>
            )}
            <p
              className="text-[10px] text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {safeTimeAgo(entry.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
