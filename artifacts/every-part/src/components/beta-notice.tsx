import { FlaskConical } from "lucide-react";

export function BetaNotice() {
  return (
    <div
      role="status"
      className="border-b border-secondary/30 bg-secondary/10 px-4 py-2.5 text-center text-sm text-foreground"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Beta version</strong>
          <span className="mx-1.5 text-muted-foreground" aria-hidden="true">·</span>
          Currently being tested with a small group of churches.
        </span>
      </div>
    </div>
  );
}