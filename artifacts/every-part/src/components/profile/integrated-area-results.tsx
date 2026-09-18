import { INSUFFICIENT_EVIDENCE, type IntegratedCategory, type integratedResults } from "../../lib/integrated-results";

type Results = NonNullable<ReturnType<typeof integratedResults>>;

/** Shared screen/print presentation; deliberately excludes answers and free text. */
export function IntegratedAreaResults({ results, category, compact = false }: {
  results: Results;
  category: IntegratedCategory;
  compact?: boolean;
}) {
  const entries = results.forCategory(category);
  if (!results.valid) {
    return <p role="status" data-testid={`status-integrated-${category}`} className="text-sm text-muted-foreground">
      This integrated result version is not supported. Its original results have not been reinterpreted.
    </p>;
  }
  return (
    <div className={compact ? "space-y-2 text-xs" : "space-y-4"} data-testid={`results-integrated-${category}`}>
      <p className="text-muted-foreground">
        {category === "Personality"
          ? "Each spectrum describes a preference, not ability or spiritual maturity. 1 is the left pole; 5 is the right pole."
          : "Independent reflection means on a 1–5 scale, not proof of gifting, calling, or readiness. All available results are shown."}
      </p>
      {entries.length === 0 && <p className="italic text-muted-foreground">{INSUFFICIENT_EVIDENCE}</p>}
      <div className={compact ? "space-y-2" : "grid gap-3"}>
        {entries.map(entry => (
          <div key={entry.construct} className={compact ? "border-b border-slate-100 pb-2 print:break-inside-avoid" : "rounded-xl border border-border/70 p-4"} data-testid={`result-${category}-${entry.construct}`}>
            <div className="flex flex-wrap justify-between gap-2">
              <h4 className="font-medium">{entry.construct}</h4>
              <span>{entry.mean === null ? INSUFFICIENT_EVIDENCE : `${entry.mean.toFixed(2)} / 5`}</span>
            </div>
            {category === "Personality" && entry.poles && (
              <div className="mt-2">
                <p className="flex justify-between gap-3 text-muted-foreground"><span>{entry.poles[0]}</span><span>{entry.poles[1]}</span></p>
                {!compact && entry.mean !== null && (
                  <div className="mt-2 h-2 rounded-full bg-muted-foreground/15" role="img" aria-label={`${entry.construct}: ${entry.mean.toFixed(2)} on a 1 to 5 left-to-right spectrum`}>
                    <div className="h-full rounded-full bg-accent/80" style={{ width: `${(entry.mean - 1) / 4 * 100}%` }} />
                  </div>
                )}
              </div>
            )}
            <p className="mt-1 text-muted-foreground">{entry.answeredCount} distinct answered {entry.answeredCount === 1 ? "item" : "items"}{entry.availableCount !== null ? ` of ${entry.availableCount} available` : ""}{entry.mean === null ? " · at least 3 required" : ""}</p>
          </div>
        ))}
      </div>
      {category === "Gift" && results.conversations.length > 0 && (
        <section className="rounded-xl border border-border/70 p-3 print:break-inside-avoid" data-testid="integrated-gift-conversations">
          <h4 className="font-medium">For conversation and discernment only</h4>
          <p className="mt-1 text-muted-foreground">These areas are unscored. Inclusion is not evidence of a spiritual gift. Optional responses and personal notes are not reproduced here.</p>
          <ul className="mt-2 space-y-1">
            {results.conversations.map(name => <li key={name}>{name} — pastoral conversation, no automated score</li>)}
          </ul>
        </section>
      )}
      <p className="text-muted-foreground">N/A, skipped, and missing answers are not scored. Shared questions can contribute to several areas; those signals are correlated, not independent confirmations.</p>
    </div>
  );
}