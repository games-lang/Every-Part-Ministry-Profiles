import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetPartFinderLeadershipProfileQueryKey,
  useGetPartFinderLeadershipProfile,
  useUpdatePartFinderLeadershipProfile,
  type PartFinderHelpPreference,
  type PartFinderLeadershipProfileInput,
} from "@workspace/api-client-react";
import {
  Check,
  Compass,
  Eye,
  PauseCircle,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const EMPTY_PROFILE: PartFinderLeadershipProfileInput = {
  priorities: [],
  energizingAreas: "",
  drainingAreas: "",
  delegationNeeds: "",
  churchChallenges: "",
  strengthenAreas: "",
  leadersToDevelop: "",
  leadershipStrengths: [],
  growthAreas: [],
  goals3Months: "",
  goals1Year: "",
  helpPreferences: [],
  coachingStyle: "balanced",
  responseLength: "standard",
  personalizationEnabled: true,
};

const HELP_OPTIONS: Array<{
  value: PartFinderHelpPreference;
  label: string;
}> = [
  { value: "find-volunteers", label: "Find volunteers" },
  { value: "delegate", label: "Delegate more effectively" },
  { value: "develop-leaders", label: "Develop leaders" },
  { value: "notice-overlooked-people", label: "Notice people I may be overlooking" },
  { value: "engage-younger-generations", label: "Engage younger generations" },
  { value: "improve-retention", label: "Improve volunteer retention" },
  { value: "follow-up", label: "Follow up with people" },
  { value: "strengthen-teams", label: "Strengthen ministry teams" },
  { value: "spot-gaps", label: "Spot ministry gaps" },
  { value: "think-strategically", label: "Think strategically" },
  { value: "protect-time", label: "Protect my time" },
  { value: "notice-burnout", label: "Recognize potential burnout" },
  { value: "challenge-assumptions", label: "Challenge assumptions respectfully" },
  { value: "explore-new-ideas", label: "Think through new ministry ideas" },
];

function listFromText(value: string, limit: number) {
  return value
    .split(",")
    .map((item) => item.slice(0, 100))
    .slice(0, limit);
}

export default function LeadershipProfilePage() {
  const queryClient = useQueryClient();
  const { data: savedProfile, isLoading } =
    useGetPartFinderLeadershipProfile();
  const updateProfile = useUpdatePartFinderLeadershipProfile();
  const [form, setForm] =
    useState<PartFinderLeadershipProfileInput>(EMPTY_PROFILE);

  useEffect(() => {
    if (!savedProfile) return;
    const { configured: _configured, updatedAt: _updatedAt, ...input } =
      savedProfile;
    setForm(input);
  }, [savedProfile]);

  const setField = <Key extends keyof PartFinderLeadershipProfileInput>(
    key: Key,
    value: PartFinderLeadershipProfileInput[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const setPriority = (index: number, value: string) => {
    const next = [...form.priorities];
    next[index] = value.slice(0, 160);
    setField("priorities", next.filter((item, itemIndex) => item || itemIndex <= index));
  };

  const toggleHelpPreference = (value: PartFinderHelpPreference) => {
    setField(
      "helpPreferences",
      form.helpPreferences.includes(value)
        ? form.helpPreferences.filter((item) => item !== value)
        : [...form.helpPreferences, value],
    );
  };

  const save = () => {
    const cleaned = {
      ...form,
      priorities: form.priorities.map((item) => item.trim()).filter(Boolean),
      leadershipStrengths: form.leadershipStrengths
        .map((item) => item.trim())
        .filter(Boolean),
      growthAreas: form.growthAreas.map((item) => item.trim()).filter(Boolean),
    };
    updateProfile.mutate(
      { data: cleaned },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getGetPartFinderLeadershipProfileQueryKey(),
          });
          toast({
            title: "Leadership profile saved",
            description: cleaned.personalizationEnabled
              ? "PartFinder can now use the context shown on this page."
              : "Your information is saved, but PartFinder personalization is paused.",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl space-y-5 px-4 py-10">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-7 px-4 py-8 sm:py-10">
      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
          PartFinder personalization
        </p>
        <h1 className="font-serif text-4xl font-semibold tracking-[-.04em]">
          My Leadership Profile
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Tell PartFinder what matters in your ministry right now. This is
          separate from your Ministry Profile, and you remain in control of
          everything PartFinder remembers.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/[0.04] shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              {form.personalizationEnabled ? (
                <Compass className="h-5 w-5" />
              ) : (
                <PauseCircle className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2 className="font-semibold text-foreground">
                Personalize PartFinder
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {form.personalizationEnabled
                  ? "PartFinder may use only the information visible on this page to tailor leadership guidance."
                  : "Personalization is paused. PartFinder will not use this leadership profile in its responses."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="partfinder-personalization" className="text-sm">
              {form.personalizationEnabled ? "On" : "Paused"}
            </Label>
            <Switch
              id="partfinder-personalization"
              checked={form.personalizationEnabled}
              onCheckedChange={(checked) =>
                setField("personalizationEnabled", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            What PartFinder knows about me
          </CardTitle>
          <CardDescription>
            This is the complete personalized context PartFinder can use. Edit
            or clear any field whenever you want.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="font-semibold">Current ministry priorities</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                What are your three biggest priorities right now?
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <Label htmlFor={`priority-${index}`}>Priority {index + 1}</Label>
                  <Input
                    id={`priority-${index}`}
                    value={form.priorities[index] ?? ""}
                    onChange={(event) => setPriority(index, event.target.value)}
                    placeholder={
                      index === 0
                        ? "Develop younger leaders"
                        : "Add another priority"
                    }
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 border-t border-border/70 pt-7 md:grid-cols-2">
            <div>
              <Label htmlFor="energizing-areas">What energizes you most?</Label>
              <Textarea
                id="energizing-areas"
                value={form.energizingAreas}
                onChange={(event) =>
                  setField("energizingAreas", event.target.value)
                }
                placeholder="Preaching, mentoring leaders, pastoral conversations…"
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="draining-areas">What tends to drain you?</Label>
              <Textarea
                id="draining-areas"
                value={form.drainingAreas}
                onChange={(event) =>
                  setField("drainingAreas", event.target.value)
                }
                placeholder="Administration, last-minute scheduling…"
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="delegation-needs">
                What would you like to delegate?
              </Label>
              <Textarea
                id="delegation-needs"
                value={form.delegationNeeds}
                onChange={(event) =>
                  setField("delegationNeeds", event.target.value)
                }
                placeholder="Responsibilities taking more time than they should…"
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="church-challenges">
                Biggest challenges facing your church
              </Label>
              <Textarea
                id="church-challenges"
                value={form.churchChallenges}
                onChange={(event) =>
                  setField("churchChallenges", event.target.value)
                }
                placeholder="Volunteer retention, follow-up, rebuilding a team…"
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="strengthen-areas">
                Areas you most want to strengthen
              </Label>
              <Textarea
                id="strengthen-areas"
                value={form.strengthenAreas}
                onChange={(event) =>
                  setField("strengthenAreas", event.target.value)
                }
                placeholder="Kids ministry, care ministry, young adult engagement…"
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="leaders-to-develop">
                Leaders you want to develop
              </Label>
              <Textarea
                id="leaders-to-develop"
                value={form.leadersToDevelop}
                onChange={(event) =>
                  setField("leadersToDevelop", event.target.value)
                }
                placeholder="Emerging small-group leaders, younger ministry leaders…"
                rows={3}
                className="mt-2"
              />
            </div>
          </section>

          <section className="grid gap-5 border-t border-border/70 pt-7 md:grid-cols-2">
            <div>
              <Label htmlFor="leadership-strengths">
                Leadership strengths
              </Label>
              <Input
                id="leadership-strengths"
                value={form.leadershipStrengths.join(", ")}
                onChange={(event) =>
                  setField(
                    "leadershipStrengths",
                    listFromText(event.target.value, 8),
                  )
                }
                placeholder="Vision, relational leadership, preaching"
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Separate items with commas.
              </p>
            </div>
            <div>
              <Label htmlFor="growth-areas">Areas where you want help</Label>
              <Input
                id="growth-areas"
                value={form.growthAreas.join(", ")}
                onChange={(event) =>
                  setField("growthAreas", listFromText(event.target.value, 8))
                }
                placeholder="Administration, delegation, team development"
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Separate items with commas.
              </p>
            </div>
            <div>
              <Label htmlFor="goals-three-months">Goals for the next 3 months</Label>
              <Textarea
                id="goals-three-months"
                value={form.goals3Months}
                onChange={(event) =>
                  setField("goals3Months", event.target.value)
                }
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="goals-one-year">Goals for the next year</Label>
              <Textarea
                id="goals-one-year"
                value={form.goals1Year}
                onChange={(event) =>
                  setField("goals1Year", event.target.value)
                }
                rows={3}
                className="mt-2"
              />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            How would you like PartFinder to help?
          </CardTitle>
          <CardDescription>
            Choose the kinds of leadership support you want prioritized.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {HELP_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 p-3 transition hover:bg-muted/50"
            >
              <Checkbox
                checked={form.helpPreferences.includes(option.value)}
                onCheckedChange={() => toggleHelpPreference(option.value)}
              />
              <span className="text-sm font-medium leading-5">{option.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            How should PartFinder communicate with you?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-7">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                value: "encouraging" as const,
                title: "Encouraging",
                description: "Supportive and positive while still practical.",
              },
              {
                value: "balanced" as const,
                title: "Balanced",
                description: "Encouraging and willing to raise overlooked possibilities.",
              },
              {
                value: "direct" as const,
                title: "Direct",
                description: "Clear, concise, and respectfully challenging.",
              },
            ].map((option) => {
              const selected = form.coachingStyle === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setField("coachingStyle", option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-semibold">
                    {option.title}
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <Label htmlFor="response-length">Response length</Label>
            <select
              id="response-length"
              value={form.responseLength}
              onChange={(event) =>
                setField(
                  "responseLength",
                  event.target.value as PartFinderLeadershipProfileInput["responseLength"],
                )
              }
              className="mt-2 h-11 w-full max-w-sm rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="brief">Brief</option>
              <option value="standard">Standard</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-secondary/70 bg-secondary/10 shadow-sm">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[auto_1fr]">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold">Transparent by design</h2>
            <div className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
              <p className="flex gap-2">
                <Eye className="mt-1 h-4 w-4 shrink-0" />
                PartFinder remembers only what is visible on this page.
              </p>
              <p className="flex gap-2">
                <Sparkles className="mt-1 h-4 w-4 shrink-0" />
                Church data and leadership preferences remain separate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          size="lg"
          onClick={save}
          disabled={updateProfile.isPending}
          className="rounded-full px-6 shadow-lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {updateProfile.isPending ? "Saving…" : "Save leadership profile"}
        </Button>
      </div>
    </div>
  );
}