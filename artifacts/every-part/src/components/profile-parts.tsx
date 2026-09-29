import { Check } from "lucide-react";

type ProfilePart = {
  label: string;
  complete?: boolean;
};

type ProfilePartsProps = {
  parts: ProfilePart[];
  current?: number;
  className?: string;
  label?: string;
  progressPercentage?: number;
  currentPartProgress?: number;
  progressUnit?: string;
};

export function ProfileParts({
  parts,
  current,
  className = "",
  label = "Profile progress",
  progressPercentage,
  currentPartProgress,
  progressUnit = "steps",
}: ProfilePartsProps) {
  const progressCount = current ?? parts.filter((part) => part.complete).length;
  const completed = current !== undefined
    ? Math.max(0, Math.min(parts.length, current - 1))
    : progressCount;
  const percentage = progressPercentage ?? (parts.length ? Math.round((completed / parts.length) * 100) : 0);

  return (
    <div className={`profile-parts ${className}`} role="group" aria-label={`${label}: ${percentage}% of ${progressUnit} complete`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {percentage}% <span className="font-normal text-muted-foreground">of {progressUnit} complete</span>
        </span>
      </div>
      <div className="flex gap-1.5" role="list" aria-label={`${completed} of ${parts.length} parts complete`}>
        {parts.map((part, index) => {
          const isComplete = index < completed || part.complete;
          const isCurrent = current === index + 1;
          return (
            <div
              key={part.label}
              role="listitem"
              aria-label={`${part.label}: ${isComplete ? "complete" : isCurrent ? "current" : "not started"}`}
              className="min-w-0 flex-1"
            >
              <div
                  className={`flex h-2.5 items-center justify-center rounded-full ${
                  isComplete
                    ? "bg-accent"
                    : isCurrent
                      ? currentPartProgress === undefined ? "bg-secondary" : "bg-muted-foreground/20"
                      : "bg-muted-foreground/20"
                }`}
              >
                {isCurrent && currentPartProgress !== undefined && <span
                  className="h-full rounded-full bg-secondary"
                  style={{ width: `${Math.max(0, Math.min(1, currentPartProgress)) * 100}%` }}
                />}
                {isComplete && <Check className="hidden h-2.5 w-2.5 text-accent-foreground sm:block" aria-hidden="true" />}
              </div>
              <span className={`mt-2 block break-words text-center text-[10px] font-medium leading-3 ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {part.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}