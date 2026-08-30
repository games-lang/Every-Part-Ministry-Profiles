type Profile = Record<string, any>;

function hasValues(value: unknown) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([, v]) => v !== null && v !== undefined && v !== "" && (!Array.isArray(v) || v.length > 0),
  );
}

function textOf(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function collectText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  return Object.values(value as Record<string, unknown>)
    .map((v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").join(", ") : textOf(v)))
    .filter(Boolean)
    .join(" — ");
}

function AskRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 break-words">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className={value ? "text-sm" : "text-sm text-muted-foreground italic"}>{value || "—"}</div>
      {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
    </div>
  );
}

export function CoordinatorAsk({ profile }: { profile: Profile }) {
  const basic = profile.basicInformation ?? {};
  const connection = profile.churchConnection ?? {};
  const skills = profile.skills ?? {};
  const availabilityText = collectText(profile.availabilityDetails);
  const servingWish =
    availabilityText || collectText(profile.ministryPreferences) || textOf(skills.previousMinistryExperience);
  const times = Array.isArray(profile.availability) ? profile.availability.join(", ") : "";
  const availability = [textOf(profile.servingFrequency), times].filter(Boolean).join(" — ");
  const capacity = textOf(basic.familySituation);
  const alreadyServing = [connection.servedBefore ? "Has served here before" : "", textOf(connection.previousService)]
    .filter(Boolean)
    .join(" — ");
  const tags = [
    ...(Array.isArray(profile.passions) ? profile.passions : []),
    ...(Array.isArray(profile.interests) ? profile.interests : []),
  ].filter((x: unknown) => typeof x === "string") as string[];
  const kidsSignal = tags.filter((x) => /child|kid|youth|student|nursery/i.test(x));
  const kidsWords = /child|kid|youth|nursery/i.test(`${servingWish} ${availabilityText}`);
  const showKids = kidsSignal.length > 0 || kidsWords;
  const prompt = `Would you try ${servingWish || "the area they mentioned"} on ${availability || "a time that works for them"} for a season, serving with our team?`;
  return (
    <section className="space-y-3 print:break-inside-avoid">
      <h2 className="font-serif text-2xl font-medium">Before you ask</h2>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground mb-3">
          A 30-second read for the coordinator before the conversation. Their own words — not a placement or a match.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <AskRow label="Serving wish (their words)" value={servingWish} />
          <AskRow label="Availability" value={availability} />
          <AskRow label="Duration they will try" value="" hint="Not on file yet — ask them." />
          <AskRow label="Capacity / season of life" value={capacity} />
          <AskRow label="Already serving" value={alreadyServing} />
          <AskRow label="Already asked" value="" hint="Not on file yet — check with your team." />
          {showKids ? (
            <AskRow
              label="Kids-safety note"
              value={kidsSignal.length ? `Mentioned: ${kidsSignal.join(", ")}` : "Mentioned children/youth in their own words"}
              hint="They volunteered interest involving children or youth. Follow your church's screening process before any ask."
            />
          ) : null}
        </div>
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-1">One conversation prompt (copy and adapt)</div>
          <p className="text-sm">{prompt}</p>
        </div>
      </div>
    </section>
  );
}

export { hasValues };c