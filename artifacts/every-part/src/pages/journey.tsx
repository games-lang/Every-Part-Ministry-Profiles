import { useMemo, useState } from "react";
import {
  getCompareJourneyProfilesQueryKey,
  getGetAdultIntegratedJourneyReviewQueryKey,
  getGetProfileJourneyQueryKey,
  getGetPublicJourneyQueryKey,
  useCompareJourneyProfiles,
  useCreateJourneyEntry,
  useGetAdultIntegratedJourneyReview,
  useGetProfileJourney,
  useGetPublicJourney,
  useUpdateJourneyEntry,
  type JourneyEntry,
  type JourneyEntryInput,
  type JourneyResponse,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  HeartHandshake,
  History,
  Loader2,
  MessageCircleHeart,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

const profileLabels: Record<string, string> = {
  discover: "Discover",
  explore: "Explore",
  develop: "Develop",
  adult: "Adult",
};

function formatDate(value: string | null | undefined, withYear = true) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function JourneyLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 px-4 py-10 sm:px-6">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
    </div>
  );
}

function JourneyError({ onRetry, publicView = false }: { onRetry: () => void; publicView?: boolean }) {
  return (
    <main className="journey-page grid min-h-[100dvh] place-items-center px-4">
      <Card className="w-full max-w-md border-destructive/20 text-center shadow-lg">
        <CardContent className="space-y-4 p-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><Compass className="h-6 w-6" /></div>
          <h1 className="font-serif text-2xl">This journey is unavailable</h1>
          <p className="text-sm leading-6 text-muted-foreground">{publicView ? "The private link may be incomplete, expired, or no longer active. Ask your church for a fresh link." : "We could not load this ministry journey. Check your connection and try again."}</p>
          {!publicView && <Button variant="outline" onClick={onRetry}><RefreshCw className="h-4 w-4" />Try again</Button>}
        </CardContent>
      </Card>
    </main>
  );
}

function Intro({ journey, publicView }: { journey: JourneyResponse; publicView: boolean }) {
  const current = journey.currentProfile;
  const name = journey.profiles.find((profile) => profile.profileType === current?.profileType)?.memberName;
  return (
    <header className="journey-rise overflow-hidden rounded-[1.75rem] border border-primary/15 bg-card shadow-lg">
      <div className="h-2 bg-gradient-to-r from-primary via-chart-3 to-secondary" />
      <div className="relative p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full border-[22px] border-secondary/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.19em] text-primary"><HeartHandshake className="h-4 w-4" />A ministry story in motion</div>
            <h1 className="font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">{publicView ? `Welcome back${name ? `, ${name}` : ""}.` : name ? `${name}'s journey` : "Ministry journey"}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">A private record of growing gifts, meaningful moments, and the conversations that help a person serve with joy.</p>
          </div>
          <Badge variant="outline" className="w-fit gap-2 border-secondary/30 bg-secondary/5 px-3 py-1.5 text-secondary"><span className="h-2 w-2 rounded-full bg-secondary" />Private companion view</Badge>
        </div>
      </div>
    </header>
  );
}

function SnapshotSummary({ journey }: { journey: JourneyResponse }) {
  const current = journey.currentProfile;
  return (
    <section className="journey-rise journey-rise-delay grid gap-4 sm:grid-cols-3">
      <Card className="journey-card border-primary/15 bg-primary/[.04]"><CardContent className="p-5"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Target className="h-4 w-4" /></div><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Current profile</p><p className="mt-1 font-serif text-2xl">{current?.profileLabel || "Not yet selected"}</p><p className="mt-1 text-sm text-muted-foreground">{current ? `Completed ${formatDate(current.completedAt)}` : "Your story is just beginning"}</p></CardContent></Card>
      <Card className="journey-card border-secondary/20 bg-secondary/[.05]"><CardContent className="p-5"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><ArrowRight className="h-4 w-4" /></div><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Next chapter</p><p className="mt-1 font-serif text-2xl">{journey.nextProfileType ? profileLabels[journey.nextProfileType] : "Keep noticing"}</p><p className="mt-1 text-sm text-muted-foreground">{journey.nextProfileType ? "A possible next profile to explore" : "There is no required next step"}</p></CardContent></Card>
      <Card className="journey-card border-chart-3/20 bg-chart-3/[.06]"><CardContent className="p-5"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-chart-3 text-primary-foreground"><CalendarDays className="h-4 w-4" /></div><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Recommended check-in</p><p className="mt-1 font-serif text-2xl">{formatDate(journey.nextCheckInDate)}</p><p className="mt-1 text-sm text-muted-foreground">A gentle invitation, not a deadline</p></CardContent></Card>
    </section>
  );
}

function PatternPanel({ journey }: { journey: JourneyResponse }) {
  const hasPatterns = journey.patterns.consistent.length > 0 || journey.patterns.emerging.length > 0;
  return (
    <Card className="journey-rise journey-rise-delay-2 border-primary/10 bg-card shadow-sm">
      <CardHeader className="p-6 pb-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div><div><CardTitle className="text-xl">Patterns worth noticing</CardTitle><CardDescription>Rule-based themes across completed profiles.</CardDescription></div></div></CardHeader>
      <CardContent className="grid gap-5 p-6 pt-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary/15 bg-primary/[.035] p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-primary">Consistent</p>{journey.patterns.consistent.length ? <div className="flex flex-wrap gap-2">{journey.patterns.consistent.map((pattern) => <Badge key={pattern} className="bg-primary/10 text-primary hover:bg-primary/10">{pattern}</Badge>)}</div> : <p className="text-sm leading-6 text-muted-foreground">As more chapters are completed, recurring themes will appear here.</p>}</div>
        <div className="rounded-2xl border border-secondary/20 bg-secondary/[.035] p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-secondary">Emerging</p>{journey.patterns.emerging.length ? <div className="flex flex-wrap gap-2">{journey.patterns.emerging.map((pattern) => <Badge key={pattern} variant="outline" className="border-secondary/30 text-secondary">{pattern}</Badge>)}</div> : <p className="text-sm leading-6 text-muted-foreground">New themes will be held lightly here as the story develops.</p>}</div>
        {!hasPatterns && <p className="text-xs text-muted-foreground sm:col-span-2">These reflections are conversation support, never a score, diagnosis, label, or placement recommendation.</p>}
      </CardContent>
    </Card>
  );
}

function ParticipantAnswerReview({ token, profileId }: { token: string; profileId: number }) {
  const [open, setOpen] = useState(false);
  const review = useGetAdultIntegratedJourneyReview(token, profileId, {
    query: {
      enabled: open,
      queryKey: getGetAdultIntegratedJourneyReviewQueryKey(token, profileId),
    },
  });
  const panelId = `answer-review-${profileId}`;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3 border-t border-border/60 pt-3">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto min-h-10 w-full justify-between whitespace-normal px-2 text-left"
          aria-controls={panelId}
        >
          <span>
            <span className="block font-medium">Review your submitted answers</span>
            <span className="block text-xs font-normal text-muted-foreground">Read-only review of this adult assessment</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent id={panelId} className="pt-3">
        {review.isLoading || review.isFetching ? (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />Loading your answer review…
          </div>
        ) : review.error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/[.04] p-4">
            <p className="text-sm text-destructive" role="alert">We could not load this answer review.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void review.refetch()}>Try again</Button>
          </div>
        ) : review.data ? (
          <div className="space-y-5" aria-label="Submitted assessment answers">
            <section className="space-y-3">
              <h3 className="font-serif text-lg">A few themes in your responses</h3>
              {review.data.patterns.length ? (
                <div className="space-y-3">
                  {review.data.patterns.map((pattern) => (
                    <article key={pattern.theme} className="rounded-xl border border-primary/15 bg-primary/[.035] p-4">
                      <h4 className="font-medium">{pattern.theme}</h4>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{pattern.description}</p>
                      <blockquote className="mt-3 border-l-2 border-primary/25 pl-3 text-sm leading-6">
                        <p>“{pattern.statement}”</p>
                        <footer className="mt-1 font-medium text-primary">{pattern.responseLabel}</footer>
                      </blockquote>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                  No recurring response themes stood out here. Every answer can still be a helpful starting point for reflection.
                </p>
              )}
            </section>
            {review.data.sections.length ? review.data.sections.map((section) => (
              <section key={section.label} className="space-y-3">
                <h3 className="font-serif text-lg">{section.label}</h3>
                <dl className="space-y-3">
                  {section.questions.map((item, index) => (
                    <div key={`${section.label}-${index}`} className="rounded-xl border border-border/60 bg-background/70 p-4">
                      <dt className="text-sm leading-6">{item.prompt}</dt>
                      <dd className="mt-2 text-sm font-medium text-primary">{item.response}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )) : (
              <p className="rounded-xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                There are no saved answers available to review for this chapter.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            There are no saved answers available to review for this chapter.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ProfilePath({ journey, leader, publicView }: { journey: JourneyResponse; leader: boolean; publicView: boolean }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="p-6 pb-3"><div className="flex items-center gap-3"><History className="h-5 w-5 text-primary" /><div><CardTitle className="text-xl">Profile chapters</CardTitle><CardDescription>The snapshots that make this story visible over time.</CardDescription></div></div></CardHeader>
      <CardContent className="space-y-3 p-6 pt-3">
        {journey.profiles.length === 0 ? <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/[.025] p-7 text-center"><Compass className="mx-auto mb-3 h-7 w-7 text-primary/70" /><p className="font-medium">No completed chapters yet</p><p className="mt-1 text-sm text-muted-foreground">A completed profile will become the first page in this journey.</p></div> : journey.profiles.map((profile, index) => (
          <article key={profile.id} className="relative rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex gap-4">
              <div className="flex shrink-0 flex-col items-center"><div className={`grid h-9 w-9 place-items-center rounded-full ${index === journey.profiles.length - 1 ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"}`}><Check className="h-4 w-4" /></div>{index < journey.profiles.length - 1 && <div className="mt-2 h-full w-px bg-border" />}</div>
              <div className="min-w-0 flex-1 pb-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{profile.profileLabel}</p><Badge variant="outline" className="capitalize">{profileLabels[profile.profileType] || profile.profileType}</Badge>{profile.age !== null && <span className="text-xs text-muted-foreground">Age {profile.age}</span>}</div><p className="mt-1 text-xs text-muted-foreground">Completed {formatDate(profile.completedAt)}</p>{profile.themes.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{profile.themes.map((theme) => <Badge key={theme} variant="secondary" className="bg-muted text-muted-foreground">{theme}</Badge>)}</div>}</div>
              {leader && <Link href={`/profiles/${profile.id}`} className="self-start text-muted-foreground transition-colors hover:text-primary" aria-label={`Open ${profile.profileLabel} profile`}><ArrowRight className="h-4 w-4" /></Link>}
            </div>
            {publicView && journey.currentProfile?.profileType === "adult" && profile.profileType === "adult" && <ParticipantAnswerReview token={journey.journeyToken} profileId={profile.id} />}
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function Timeline({ entries, leader, onReflectionSaved }: { entries: JourneyEntry[]; leader: boolean; onReflectionSaved: (entry: JourneyEntry) => void }) {
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()), [entries]);
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="p-6 pb-3"><div className="flex items-center gap-3"><MessageCircleHeart className="h-5 w-5 text-secondary" /><div><CardTitle className="text-xl">Moments along the way</CardTitle><CardDescription>Check-ins and milestones kept with care.</CardDescription></div></div></CardHeader>
      <CardContent className="p-6 pt-3">
        {sortedEntries.length === 0 ? <div className="rounded-2xl border border-dashed border-secondary/30 bg-secondary/[.03] p-9 text-center"><MessageCircleHeart className="mx-auto mb-3 h-8 w-8 text-secondary/75" /><p className="font-medium">The timeline is ready for its first moment</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{leader ? "Add a milestone or check-in when there is something worth remembering." : "As your church walks with you, meaningful moments will appear here."}</p></div> : <div className="space-y-4">{sortedEntries.map((entry) => <TimelineEntry key={entry.id} entry={entry} leader={leader} onSaved={onReflectionSaved} />)}</div>}
      </CardContent>
    </Card>
  );
}

function TimelineEntry({ entry, leader, onSaved }: { entry: JourneyEntry; leader: boolean; onSaved: (entry: JourneyEntry) => void }) {
  const [reflection, setReflection] = useState(entry.reflection ?? "");
  const [editing, setEditing] = useState(false);
  const update = useUpdateJourneyEntry();
  const isCheckIn = entry.entryType === "check_in";
  const save = () => update.mutate({ id: entry.id, data: { reflection: reflection.trim() || null } }, { onSuccess: (saved) => { onSaved(saved); setEditing(false); toast({ title: "Reflection saved" }); }, onError: () => toast({ title: "Could not save reflection", description: "Please try again.", variant: "destructive" }) });
  return (
    <article className={`rounded-2xl border p-5 ${isCheckIn ? "border-primary/15 bg-primary/[.025]" : "border-secondary/20 bg-secondary/[.025]"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-2"><Badge className={isCheckIn ? "bg-primary/10 text-primary hover:bg-primary/10" : "bg-secondary/15 text-secondary hover:bg-secondary/15"}>{isCheckIn ? "Check-in" : "Milestone"}</Badge><span className="text-xs text-muted-foreground">{formatDateTime(entry.occurredAt)}</span></div>{entry.ministryArea && <span className="text-xs font-medium text-muted-foreground">{entry.ministryArea}</span>}</div>
      <h3 className="mt-4 font-serif text-2xl">{entry.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/80">{entry.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 pt-3 text-xs text-muted-foreground"><span>Added by {entry.author}</span>{entry.updatedAt !== entry.createdAt && <span>Updated {formatDateTime(entry.updatedAt)}</span>}</div>
      {(entry.reflection || leader) && <div className="mt-4 rounded-xl border border-border/60 bg-background/70 p-4">{leader && editing ? <div className="space-y-3"><Label htmlFor={`reflection-${entry.id}`}>Future reflection</Label><Textarea id={`reflection-${entry.id}`} value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={2000} placeholder="What would be helpful to remember when you revisit this moment?" /><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => { setReflection(entry.reflection ?? ""); setEditing(false); }}>Cancel</Button><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save reflection</Button></div></div> : <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Reflection</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{entry.reflection || "No future reflection added yet."}</p></div>{leader && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{entry.reflection ? "Edit" : "Add reflection"}</Button>}</div>}</div>}
    </article>
  );
}

function AddEntry({ token, onCreated }: { token: string; onCreated: (entry: JourneyEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState<JourneyEntryInput["entryType"]>("check_in");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ministryArea, setMinistryArea] = useState("");
  const [author, setAuthor] = useState("");
  const [reflection, setReflection] = useState("");
  const create = useCreateJourneyEntry();
  const reset = () => { setTitle(""); setDescription(""); setMinistryArea(""); setAuthor(""); setReflection(""); setOpen(false); };
  const submit = () => {
    if (!title.trim() || !description.trim() || !author.trim()) { toast({ title: "A few details are needed", description: "Add a title, description, and author before saving.", variant: "destructive" }); return; }
    create.mutate({ token, data: { entryType, occurredAt, title: title.trim(), description: description.trim(), ministryArea: ministryArea.trim() || null, author: author.trim(), reflection: reflection.trim() || null } }, { onSuccess: (entry) => { onCreated(entry); reset(); toast({ title: entryType === "check_in" ? "Check-in added" : "Milestone added" }); }, onError: () => toast({ title: "Could not add this moment", description: "Please try again.", variant: "destructive" }) });
  };
  return <Card className="border-primary/15 bg-primary/[.025] shadow-sm"><CardContent className="p-5">{!open ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Keep the story current</p><p className="mt-1 text-sm text-muted-foreground">Capture a moment that may help the next conversation.</p></div><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add a moment</Button></div> : <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl">Add to the journey</h2><p className="text-sm text-muted-foreground">Write for the future reader, with care and specificity.</p></div><Button variant="ghost" onClick={reset}>Close</Button></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setEntryType("check_in")} className={`rounded-xl border p-4 text-left ${entryType === "check_in" ? "border-primary bg-primary/10" : "border-border bg-card"}`}><span className="font-medium text-primary">Check-in</span><span className="mt-1 block text-xs text-muted-foreground">A conversation, review, or gentle follow-up.</span></button><button type="button" onClick={() => setEntryType("milestone")} className={`rounded-xl border p-4 text-left ${entryType === "milestone" ? "border-secondary bg-secondary/10" : "border-border bg-card"}`}><span className="font-medium text-secondary">Milestone</span><span className="mt-1 block text-xs text-muted-foreground">A meaningful step, experience, or celebration.</span></button></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="journey-title">Title</Label><Input id="journey-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="A clear moment to remember" /></div><div className="space-y-2"><Label htmlFor="journey-date">Date</Label><Input id="journey-date" type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="journey-area">Ministry area <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="journey-area" value={ministryArea} onChange={(event) => setMinistryArea(event.target.value)} maxLength={120} placeholder="For example, hospitality" /></div><div className="space-y-2"><Label htmlFor="journey-author">Author</Label><Input id="journey-author" value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={120} placeholder="Your name" /></div></div><div className="space-y-2"><Label htmlFor="journey-description">What happened?</Label><Textarea id="journey-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} placeholder="Describe what you noticed or what took place." /></div><div className="space-y-2"><Label htmlFor="journey-reflection">Future reflection <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="journey-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={2000} placeholder="A question or thought to revisit later." /></div><div className="flex justify-end"><Button onClick={submit} disabled={create.isPending}>{create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save moment</Button></div></div>}</CardContent></Card>;
}

function ComparePanel({ journey }: { journey: JourneyResponse }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const valid = Number(left) > 0 && Number(right) > 0 && left !== right;
  const comparison = useCompareJourneyProfiles(journey.journeyToken, Number(left), Number(right), { query: { enabled: valid, queryKey: getCompareJourneyProfilesQueryKey(journey.journeyToken, Number(left), Number(right)) } });
  return <Card className="border-border/70 shadow-sm"><CardHeader className="p-6 pb-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/10 text-secondary"><History className="h-5 w-5" /></div><div><CardTitle className="text-xl">Compare two chapters</CardTitle><CardDescription>Use shared themes as a starting point for conversation.</CardDescription></div></div></CardHeader><CardContent className="space-y-5 p-6 pt-3"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="compare-left">Earlier chapter</Label><select id="compare-left" value={left} onChange={(event) => setLeft(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Choose a chapter</option>{journey.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.profileLabel} · {formatDate(profile.completedAt)}</option>)}</select></div><div className="space-y-2"><Label htmlFor="compare-right">Later chapter</Label><select id="compare-right" value={right} onChange={(event) => setRight(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Choose a chapter</option>{journey.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.profileLabel} · {formatDate(profile.completedAt)}</option>)}</select></div></div><p className="text-xs leading-5 text-muted-foreground">This comparison is rule-based conversation support. It is not a score, diagnosis, label, or placement recommendation.</p>{comparison.isFetching && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Reading the two chapters…</div>}{comparison.error && <p className="text-sm text-destructive">We could not compare those chapters. Please try again.</p>}{comparison.data && <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-sm font-medium">{comparison.data.left.profileLabel} <span className="px-1 text-muted-foreground">to</span> {comparison.data.right.profileLabel}</p><p className="mt-1 text-xs text-muted-foreground">A pair of snapshots, not a measurement of progress.</p></div><div className="rounded-xl bg-primary/[.04] p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Shared themes</p><div className="mt-3 flex flex-wrap gap-2">{comparison.data.sharedThemes.length ? comparison.data.sharedThemes.map((theme) => <Badge key={theme} className="bg-primary/10 text-primary hover:bg-primary/10">{theme}</Badge>) : <p className="text-sm text-muted-foreground">No shared themes in these snapshots.</p>}</div></div><div className="rounded-xl bg-secondary/[.05] p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-secondary">Emerging themes</p><div className="mt-3 flex flex-wrap gap-2">{comparison.data.emergingThemes.length ? comparison.data.emergingThemes.map((theme) => <Badge key={theme} variant="outline" className="border-secondary/30 text-secondary">{theme}</Badge>) : <p className="text-sm text-muted-foreground">No emerging themes in these snapshots.</p>}</div></div><p className="text-sm leading-6 text-muted-foreground sm:col-span-2">{comparison.data.note}</p></div>}</CardContent></Card>;
}

function JourneyContent({ journey, publicView, leader }: { journey: JourneyResponse; publicView: boolean; leader: boolean }) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState(journey.entries);
  const profileType = journey.currentProfile?.profileType || "adult";
  const pathwayTheme =
    profileType === "discover"
      ? "pathway-theme-discover"
      : profileType === "explore"
        ? "pathway-theme-explore"
        : profileType === "develop"
          ? "pathway-theme-develop"
          : "pathway-theme-adult";
  const addEntry = (entry: JourneyEntry) => { setEntries((current) => [entry, ...current]); void queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).includes("/journey") }); };
  const updateEntry = (entry: JourneyEntry) => setEntries((current) => current.map((item) => item.id === entry.id ? entry : item));
  return <div className={`pathway-theme ${pathwayTheme} journey-page min-h-[100dvh]`}><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-6 sm:py-10"><div className="flex items-center justify-between"><Link href={publicView ? "/" : "/profiles"} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" />{publicView ? "Every Part" : "Profiles"}</Link>{publicView && <span className="text-xs text-muted-foreground">Private link</span>}</div><Intro journey={{ ...journey, entries }} publicView={publicView} /><SnapshotSummary journey={journey} /><div className="grid gap-6 lg:grid-cols-[1.16fr_.84fr]"><div className="space-y-6"><PatternPanel journey={journey} /><Timeline entries={entries} leader={leader} onReflectionSaved={updateEntry} /></div><div className="space-y-6"><ProfilePath journey={journey} leader={leader} publicView={publicView} />{leader && <AddEntry token={journey.journeyToken} onCreated={addEntry} />}{leader && <ComparePanel journey={journey} />}</div></div><footer className="border-t border-border/60 pt-5 text-center text-xs leading-5 text-muted-foreground">A trusted companion for ministry conversations. Notice patterns gently; leave room for growth, context, and grace.</footer></main></div>;
}

export function PublicJourneyPage({ params }: { params: { token?: string } }) {
  const token = params.token || "";
  const query = useGetPublicJourney(token, { query: { enabled: !!token, queryKey: getGetPublicJourneyQueryKey(token) } });
  if (query.isLoading) return <JourneyLoading />;
  if (query.error || !query.data) return <JourneyError publicView onRetry={() => void query.refetch()} />;
  return <JourneyContent journey={query.data} publicView leader={false} />;
}

export function LeaderJourneyPage() {
  const [, params] = useRoute("/profiles/:id/journey");
  const id = Number(params?.id || 0);
  const query = useGetProfileJourney(id, { query: { enabled: !!id, queryKey: getGetProfileJourneyQueryKey(id) } });
  if (query.isLoading) return <JourneyLoading />;
  if (query.error || !query.data) return <JourneyError onRetry={() => void query.refetch()} />;
  return <JourneyContent journey={query.data} publicView={false} leader />;
}

export default PublicJourneyPage;