// Shared DetailForge wordmark with Lazer84 font and T-A kerning fix.
// Use this component everywhere the "DetailForge" brand name appears.
// The kerning fix pulls the "a" closer to the "t" to eliminate the
// natural gap in Lazer84's letter spacing.

interface WordmarkProps {
  className?: string;
  /** Show ".io" suffix (used in "Powered by" footers) */
  showDotIo?: boolean;
}

export default function Wordmark({ className = "text-2xl", showDotIo = false }: WordmarkProps) {
  return (
    <span
      className={`tracking-wide whitespace-nowrap ${className}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      Det<span style={{ marginLeft: "-0.25em" }}>a</span>il
      <span className="text-[var(--color-purple-action)]">Forge</span>
      {showDotIo && (
        <span
          className="text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-ui)", fontSize: "0.75em" }}
        >
          .io
        </span>
      )}
    </span>
  );
}
