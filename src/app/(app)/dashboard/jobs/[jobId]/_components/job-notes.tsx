"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Check } from "lucide-react";

interface JobNotesProps {
  jobId: string;
  initialNotes: string;
}

export default function JobNotes({ jobId, initialNotes }: JobNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [lastSaved, setLastSaved] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
    };
  }, []);

  const isDirty = notes !== lastSaved;

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch(`/api/jobs/${jobId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        setLastSaved(notes);
        setSaved(true);
        if (savedTimeout.current) clearTimeout(savedTimeout.current);
        savedTimeout.current = setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to save notes");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <label
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Detailer Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this job..."
        rows={3}
        className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-purple-action)] resize-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)] disabled:bg-[var(--color-elevated)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save"
          )}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-green)]">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
