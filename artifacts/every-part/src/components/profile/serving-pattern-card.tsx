import type { LucideIcon } from "lucide-react";

export type TendencyDefinition = {
  name: string;
  description: string;
  explanation: string;
  strengths: string[];
  blindSpots: string[];
  icon: LucideIcon;
};

/**
 * The six body-metaphor serving patterns (Hands, Ears, Shoulders, Voice, Arms, Backbone).
 * This is calculated from personality with supporting natural strengths, and lives inside
 * "Where These Things Come Together" and is never presented as a fifth framework area.
 */
export function ServingPatternCard({
  tendency,
  tendencies,
  perspective,
}: {
  tendency: { key: string; secondaryKey?: string | null };
  tendencies: Record<string, TendencyDefinition>;
  perspective: "participant" | "leader";
}) {
  const definition = tendencies[tendency.key];
  if (!definition) return null;
  const isParticipant = perspective === "participant";
  const Icon = definition.icon;
  const secondary = tendency.secondaryKey ? tendencies[tendency.secondaryKey] : null;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {`${isParticipant ? "Your Serving Pattern" : "Their Serving Pattern"} · Like the ${tendency.key}`}
          </div>
          <h3 className="text-2xl font-serif font-medium mb-3">{definition.name}</h3>
        </div>
        <Icon className="h-8 w-8 shrink-0 text-primary/50" aria-hidden="true" />
      </div>
      <p className="text-muted-foreground leading-relaxed text-lg mb-4">
        {isParticipant ? definition.explanation : definition.explanation.replace(/\bYou\b/g, "They").replace(/\byou\b/g, "they")}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {`This pattern is calculated from personality spectra, with natural strengths as supporting evidence. Ministry orientation and spiritual gifts are not inputs to this calculation. It describes how ${isParticipant ? "you" : "they"} may tend to show up in practice, not a separate framework area or a placement.`}
      </p>
      {secondary && (
        <div className="mb-6 rounded-xl bg-accent/5 border border-accent/10 p-4 text-sm text-foreground/80">
          {isParticipant ? "Your scores" : "Their responses"} were close to <strong className="font-medium text-accent-foreground">{secondary.name}</strong>, suggesting {isParticipant ? "you" : "they"} may draw on both approaches depending on the people and situation.
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border/40">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary/40"></div>
            Potential Strengths
          </h4>
          <ul className="text-sm space-y-2 text-foreground/80">
            {definition.strengths.map((s) => (
              <li key={s} className="flex gap-3"><span className="text-primary/40">•</span><span className="leading-snug">{s}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500/60"></div>
            Things to Watch
          </h4>
          <ul className="text-sm space-y-2 text-foreground/80">
            {definition.blindSpots.map((s) => (
              <li key={s} className="flex gap-3"><span className="text-amber-500/60">•</span><span className="leading-snug">{s}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
