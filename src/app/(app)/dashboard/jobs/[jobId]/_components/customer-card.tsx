import { formatPhone } from "@/lib/format";

// ---------------------------------------------------------------------------
// Intent label map — shared with the main page
// ---------------------------------------------------------------------------

const INTENT_LABELS: Record<string, string> = {
  wash: "Wash & basic clean",
  interior: "Deep interior clean",
  paint: "Scratch or paint issues",
  protection: "Long-term protection",
  unsure: "Wants recommendation",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerCardProps {
  customer: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  createdAt: Date;
  intents: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomerCard({ customer, createdAt, intents }: CustomerCardProps) {
  const fullName = `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}`;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
      <p
        className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Customer
      </p>

      {/* Name */}
      <p className="text-[15px] font-medium text-[var(--color-text)]">{fullName}</p>

      {/* Email */}
      {customer.email && (
        <p className="text-xs">
          <a
            href={`mailto:${customer.email}`}
            className="text-[var(--color-purple-text)] no-underline hover:underline"
          >
            {customer.email}
          </a>
        </p>
      )}

      {/* Phone */}
      {customer.phone && (
        <p className="text-xs text-[var(--color-muted)]">{formatPhone(customer.phone)}</p>
      )}

      {/* Submission date */}
      <p
        className="text-[11px] text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Submitted{" "}
        {createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Divider + Stated intent */}
      {intents.length > 0 && (
        <>
          <hr className="border-t border-[var(--color-border)]" />
          <p
            className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Stated intent
          </p>
          <div className="flex flex-wrap gap-1.5">
            {intents.map((intent) => (
              <span
                key={intent}
                className="rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]"
              >
                {INTENT_LABELS[intent] ?? intent}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
