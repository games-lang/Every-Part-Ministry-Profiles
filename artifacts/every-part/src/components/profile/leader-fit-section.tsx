import { CheckCircle, Compass, Target, TrendingUp } from "lucide-react";
import type { getLeaderSynthesis } from "../../lib/leader-derivation";

type MinistryFit = ReturnType<typeof getLeaderSynthesis>["ministryFit"];
type FitSuggestion = MinistryFit["strong"][number];

function FitCard({ suggestion }: { suggestion: FitSuggestion }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
      <h5 className="font-medium">{suggestion.title}</h5>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {suggestion.rationale}
      </p>
      <details className="mt-3 rounded-lg bg-muted/30 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">
          Why this appeared
        </summary>
        <dl className="mt-3 space-y-2">
          {suggestion.signals.map((signal) => (
            <div
              key={signal.category}
              className="grid gap-1 border-t border-border/50 pt-2 sm:grid-cols-[8.5rem_1fr]"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {signal.category}
              </dt>
              <dd className={signal.present ? "text-sm" : "text-sm text-muted-foreground"}>
                {signal.detail}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function FitGroup({
  title,
  description,
  items,
  icon: Icon,
}: {
  title: string;
  description: string;
  items: FitSuggestion[];
  icon: typeof CheckCircle;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <div>
        <h4 className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <FitCard key={item.title} suggestion={item} />
        ))}
      </div>
    </section>
  );
}

export function LeaderFitSection({ ministryFit }: { ministryFit: MinistryFit }) {
  const hasSuggestions =
    ministryFit.strong.length +
      ministryFit.exploring.length +
      ministryFit.stretch.length >
    0;

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 font-serif text-2xl font-medium">
        <Target className="h-6 w-6 text-primary/70" />
        Ministry Fit
      </h3>
      <div className="space-y-7 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm leading-6 text-muted-foreground">
          These are reasons to begin a prayerful conversation, not assignments,
          declarations of calling, or judgments about readiness.
        </p>
        <FitGroup
          title="Strong Alignment"
          description="The person named this interest and several independent profile signals support discussing it."
          items={ministryFit.strong}
          icon={CheckCircle}
        />
        <FitGroup
          title="Worth Exploring"
          description="The interest is clear, while conversation is still needed to understand fit, readiness, and desire."
          items={ministryFit.exploring}
          icon={Compass}
        />
        <FitGroup
          title="Possible Stretch / Development"
          description="This may be better approached as development, shadowing, a lighter experiment, or a future conversation."
          items={ministryFit.stretch}
          icon={TrendingUp}
        />
        {!hasSuggestions && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-6 text-center text-sm italic text-muted-foreground">
            No configuration-enabled, self-named ministry interests are
            available for a responsible fit conversation.
          </div>
        )}
      </div>
    </section>
  );
}