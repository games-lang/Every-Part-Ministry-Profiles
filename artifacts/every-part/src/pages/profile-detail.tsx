import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRoute, Link } from "wouter";
import {
  getGetDashboardSummaryQueryKey,
  useGetProfile,
  getGetProfileQueryKey,
  getListTeamsQueryKey,
  useListTeams,
  useUpdateProfileTeam,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clipboard, Compass, Loader2, Mail, Phone, Printer, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { personalitySummarySentence } from "@/lib/personality-prose";
import { CoordinatorAsk } from "@/components/coordinator-ask";
import { toast } from "@/hooks/use-toast";
import { ProfileSchedule } from "@/components/profile-schedule";
import { ProfileHelper } from "@/components/profile-helper";
import { ProfileAvatar } from "@/components/profile-photo-uploader";
import { ChurchProfileBranding } from "@/components/church-profile-branding";

const empty = "Not shared";
const spiritualGiftMeanings: Record<string, string> = {
  "Administration":"organizing people, resources, and systems effectively", "Apostleship":"pioneering, starting, expanding, and establishing new ministries or works", "Discernment of Spirits":"recognizing what is from God, human influence, or spiritual deception", "Evangelism":"communicating the gospel and helping people respond to Jesus", "Exhortation / Encouragement":"strengthening, motivating, comforting, and challenging others", "Faith":"unusual confidence in God’s power, promises, and provision", "Giving":"generously and joyfully sharing resources to advance God’s work and meet needs", "Healing":"being used by God as an instrument of physical, emotional, or spiritual healing", "Helps / Service":"meeting practical needs and supporting others so ministry can happen", "Hospitality":"welcoming people and creating environments where others feel received and cared for", "Interpretation of Tongues":"interpreting a message spoken in tongues", "Knowledge":"understanding and communicating spiritual truth or insight", "Leadership":"providing direction, motivating others, and helping a group move toward God-given goals", "Mercy":"compassionately caring for people who are hurting, struggling, marginalized, or in need", "Miracles":"being used by God in extraordinary demonstrations of His power", "Pastoring / Shepherding":"caring for, protecting, guiding, and nurturing people spiritually", "Prophecy":"communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction", "Teaching":"explaining and applying biblical truth so others understand and grow", "Tongues":"speaking in a language or spiritual utterance given through the Holy Spirit", "Wisdom":"applying spiritual truth appropriately to real situations", "Craftsmanship":"using artistic or practical skill for God’s purposes", "Intercession":"persistent, focused prayer for others", "Missionary / Cross-Cultural Ministry":"effectively ministering across cultures and communities", "Music / Worship":"using musical ability to lead and encourage worship", "Celibacy":"a particular grace for remaining unmarried for undivided devotion to ministry", "Voluntary Poverty":"willingly living with less in order to serve God and others",
};
export const responseLabels = ["", "Not at all", "A little", "Sometimes", "Often", "Very much"];
export const MINISTRY_APPROACHES = [
  ["builder", "Starting and building new ministry"], ["insight", "Noticing what needs attention"], ["connector", "Connecting people with faith"], ["caregiver", "Caring for people over time"], ["teacher", "Making ideas clear"],
] as const;
export const MINISTRY_TAGS: Record<string, string> = {
  "Starting and building new ministry": "Apostle",
  "Noticing what needs attention": "Prophet",
  "Connecting people with faith": "Evangelist",
  "Caring for people over time": "Shepherd",
  "Making ideas clear": "Teacher",
};
export const STRENGTH_APPROACHES = [
  ["relationalConnection", "Relational connection"], ["encouragement", "Encouragement"], ["teachingExplaining", "Teaching and explaining"], ["listening", "Listening"], ["leadershipInitiative", "Leadership and initiative"], ["organizing", "Organizing"], ["creativeExpression", "Creative expression"], ["problemSolving", "Problem-solving"], ["practicalHandsOn", "Practical hands-on work"], ["hospitality", "Hospitality"], ["compassionCare", "Compassion and care"], ["communicationStorytelling", "Communication and storytelling"], ["discernment", "Discernment"], ["followThrough", "Follow-through"], ["adaptability", "Adaptability"], ["mentoringDevelopment", "Mentoring and development"], ["strategicThinking", "Strategic thinking"], ["advocacyJustice", "Advocacy and justice"],
] as const;
export const PERSONALITY_DIMENSIONS = [
  ["socialEnergy", "Social Energy", "Reflective", "Interactive", "You tend to process internally and may recharge through quieter environments, deeper conversations, or time alone.", "You tend to process through interaction and may gain energy through conversation, activity, and being around others.", "thoughtful and reflective", "energized by interaction", "how you connect with people and communicate in groups"],
  ["decisionLens", "Decision Lens", "Relational", "Principled", "You naturally consider people, relationships, compassion, emotional impact, and how others will be affected.", "You naturally consider logic, consistency, fairness, standards, facts, and what solution makes the most sense.", "relationship-aware", "principled and consistent", "how you weigh people, compassion, fairness, and consistency when making decisions"],
  ["planningStyle", "Planning Style", "Adaptive", "Settled", "You may enjoy flexibility, keeping options open, adjusting as you go, and responding to changing circumstances.", "You may prefer clear expectations, schedules, deadlines, decisions, and knowing what comes next.", "flexible and adaptive", "prepared and settled", "how you respond to change and how much structure helps you serve well"],
  ["focusStyle", "Focus Style", "Detail", "Big Picture", "You tend to notice practical needs, specific information, logistics, steps, and what needs attention right now.", "You tend to notice patterns, possibilities, future direction, ideas, connections, and what something could become.", "attentive to detail", "big-picture oriented", "whether you naturally begin with practical details or broader direction"],
  ["actionStyle", "Action Style", "Support", "Initiate", "You may naturally strengthen, improve, assist, maintain, and help existing efforts succeed.", "You may naturally start things, suggest new approaches, create momentum, and move ideas into action.", "supportive and strengthening", "initiative-taking", "whether you are most energized by strengthening existing work or starting something new"],
  ["pacePreference", "Pace Preference", "Steady", "Dynamic", "You may thrive with consistency, predictable rhythms, focused responsibilities, and sustainable routines.", "You may enjoy variety, change, multiple responsibilities, urgency, and fast-moving environments.", "steady and sustainable", "dynamic and responsive", "what rhythms, pace, and level of change help you remain engaged"],
  ["workStyle", "Work Style", "Independent", "Collaborative", "You may enjoy autonomy, focused responsibility, personal ownership, and being trusted to complete a task.", "You may enjoy shared responsibility, brainstorming, interaction, feedback, and accomplishing things together.", "self-directed", "collaborative", "how you handle responsibility, feedback, teamwork, and shared ownership"],
] as const;
export type PersonalityDimension = { label: string; left: string; right: string; leftPercentage: number; rightPercentage: number; tendency: string; explanation: string; dominant: "left" | "right" | "balanced"; leftSummary: string; rightSummary: string; ministry: string };
export function numericResponses(value: unknown) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(record).filter(([, response]) => typeof response === "number" && Number.isFinite(response))) as Record<string, number>;
}
export function rankedApproaches(responses: Record<string, number>, approaches: readonly (readonly [string, string])[], isEnabled: (key: string) => boolean) {
  return approaches.filter(([key]) => isEnabled(key) && Object.keys(responses).some(responseKey => new RegExp(`^${key}-\\d+$`).test(responseKey))).map(([key, label]) => ({ label, score: Object.entries(responses).reduce((total, [responseKey, response]) => new RegExp(`^${key}-\\d+$`).test(responseKey) ? total + response : total, 0) })).sort((a, b) => b.score - a.score);
}
export function derivedPersonality(responses: Record<string, number>, isEnabled: (key: string) => boolean): PersonalityDimension[] {
  return PERSONALITY_DIMENSIONS.filter(([key]) => isEnabled(key) && Object.keys(responses).some(responseKey => new RegExp(`^${key}-\\d+$`).test(responseKey))).map(([key, label, left, right, leftExplanation, rightExplanation, leftSummary, rightSummary, ministry]) => {
    const scores = [0, 1, 2].map(index => responses[`${key}-${index}`] ?? 3);
    const rightPercentage = Math.round(((scores.reduce((total, score) => total + score, 0) / scores.length - 1) / 4) * 100);
    const leftPercentage = 100 - rightPercentage;
    const dominant = leftPercentage === rightPercentage ? "balanced" : leftPercentage > rightPercentage ? "left" : "right";
    const percentage = Math.max(leftPercentage, rightPercentage);
    const tendency = dominant === "balanced" || percentage <= 55 ? "Balanced" : percentage <= 65 ? "Slight tendency" : percentage <= 79 ? "Moderate tendency" : percentage <= 91 ? "Strong tendency" : "Very strong tendency";
    return { label, left, right, leftPercentage, rightPercentage, dominant, tendency, leftSummary, rightSummary, ministry, explanation: dominant === "left" ? leftExplanation : dominant === "right" ? rightExplanation : `You draw from both ${left.toLowerCase()} and ${right.toLowerCase()} approaches, adapting to what the situation requires.` };
  });
}
function personalitySummary(results: PersonalityDimension[]) {
  const nonBalanced = results.filter(result => result.dominant !== "balanced");
  const descriptors = [...nonBalanced].sort((a, b) => Math.max(b.leftPercentage, b.rightPercentage) - Math.max(a.leftPercentage, a.rightPercentage)).slice(0, 3).map(result => result.dominant === "left" ? result.leftSummary : result.rightSummary);
  return personalitySummarySentence(descriptors, nonBalanced.slice(0, 2).map(result => result.ministry));
}
function personalityMinistryConnection(results: PersonalityDimension[]) {
  const tendencies = results.filter(result => result.dominant !== "balanced").slice(0, 3).map(result => result.dominant === "left" ? result.leftSummary : result.rightSummary);
  return tendencies.length ? `In ministry, your ${tendencies.join(", ")} tendencies may influence how you interact with people, communicate, respond to change, make decisions, and handle responsibility. You may feel most energized in environments that fit your natural rhythms while also leaving room for God to stretch you.` : "In ministry, your balanced tendencies may help you adapt across different people, teams, rhythms, and responsibilities.";
}
export function ResponseLabel({ value }: { value: unknown }) {
  return <span className="text-muted-foreground">{typeof value === "number" ? responseLabels[value] || "Response shared" : "Response shared"}</span>;
}
export function SpiritualGifts({ value }: { value: unknown }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const topGifts = Array.isArray(record.topGifts) ? record.topGifts.filter((gift): gift is string => typeof gift === "string") : [];
  const responses = record.responses && typeof record.responses === "object" ? record.responses as Record<string, unknown> : {};
  if (!topGifts.length && !Object.keys(responses).length) return <p className="text-muted-foreground italic">No spiritual gifts reflection shared.</p>;
  return <div className="space-y-5">{topGifts.length > 0 && <div><h3 className="font-medium mb-2">Gifts selected for conversation</h3><div className="space-y-2">{topGifts.map(gift=><div key={gift} className="rounded-lg border border-border/60 p-3"><strong>{gift}</strong><p className="text-sm text-muted-foreground mt-1">{spiritualGiftMeanings[gift] || "Member-selected gift for pastoral conversation."}</p></div>)}</div></div>}{Object.keys(responses).length > 0 && <div><h3 className="font-medium mb-2">Reflection responses</h3><div className="space-y-3">{Object.entries(responses).map(([gift,response])=><div key={gift} className="rounded-lg border border-border/60 p-3"><div className="text-sm font-medium">{gift}</div>{Array.isArray(response) ? <ol className="mt-2 space-y-2 text-sm">{response.map((entry,index)=>{const reflection=entry && typeof entry === "object" ? entry as Record<string, unknown> : {}; return <li key={index}><p>{typeof reflection.prompt === "string" ? reflection.prompt : `Reflection question ${index + 1}`}</p><ResponseLabel value={reflection.response}/></li>;})}</ol> : <div className="text-sm"><ResponseLabel value={response}/></div>}</div>)}</div></div>}</div>;
}
export function Value({ label, value }: {label:string;value: unknown}) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return <div className="rounded-xl border border-border/60 bg-background/60 p-3.5 break-words"><div className="mb-1 text-xs font-semibold uppercase tracking-[.08em] text-muted-foreground">{label}</div><div className={text ? "" : "text-muted-foreground italic"}>{text || empty}</div></div>;
}
export function ObjectValues({ value, labels }: {value: unknown; labels?: Record<string, string>}) {
  if (!value || typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(([,v]) => v !== null && v !== "" && (!Array.isArray(v) || v.length));
  if (!entries.length) return null;
  return <div className="grid sm:grid-cols-2 gap-3">{entries.map(([key,val]) => <Value key={key} label={labels?.[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./,x=>x.toUpperCase())} value={Array.isArray(val) ? val.join(", ") : typeof val === "object" ? JSON.stringify(val) : val}/>)}</div>;
}
export function Languages({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const storedEntries = Array.isArray(record.entries) ? record.entries : [];
  const entries = storedEntries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const language = (entry as Record<string, unknown>).language;
    const proficiency = (entry as Record<string, unknown>).proficiency;
    return typeof language === "string" && language.trim()
      ? [{
          language: language.trim(),
          proficiency: typeof proficiency === "string" ? proficiency : "",
        }]
      : [];
  });
  if (entries.length) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry, index) => (
          <Value
            key={`${entry.language}-${index}`}
            label={entry.language}
            value={entry.proficiency}
          />
        ))}
      </div>
    );
  }
  const spoken = Array.isArray(record.spoken)
    ? record.spoken.filter((language): language is string => typeof language === "string")
    : [];
  const legacyProficiency =
    typeof record.proficiency === "string" ? record.proficiency : "";
  if (spoken.length) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {spoken.map((language, index) => (
          <Value
            key={`${language}-${index}`}
            label={language}
            value={legacyProficiency}
          />
        ))}
      </div>
    );
  }
  return <ObjectValues value={value} />;
}
export function MinistryAssessment({ value, isEnabled }: { value: unknown; isEnabled: (subsection: string) => boolean }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const legacyLabels: Record<string, string> = {
    Apostle: "Starting and building new ministry",
    Prophet: "Noticing what needs attention",
    Evangelist: "Connecting people with faith",
    Shepherd: "Caring for people over time",
    Teacher: "Making ideas clear",
  };
  const primaryValue = typeof record.primary === "string" ? record.primary : "";
  const secondaryValue = typeof record.secondary === "string" ? record.secondary : "";
  const subsectionByTendency: Record<string, string> = { Apostle: "builder", "Starting and building new ministry": "builder", Prophet: "insight", "Noticing what needs attention": "insight", Evangelist: "connector", "Connecting people with faith": "connector", Shepherd: "caregiver", "Caring for people over time": "caregiver", Teacher: "teacher", "Making ideas clear": "teacher" };
  const storedPrimary = isEnabled(subsectionByTendency[primaryValue]) ? legacyLabels[primaryValue] || primaryValue : "";
  const storedSecondary = isEnabled(subsectionByTendency[secondaryValue]) ? legacyLabels[secondaryValue] || secondaryValue : "";
  const rankings = rankedApproaches(numericResponses(record.responses), MINISTRY_APPROACHES, isEnabled);
  const primary = storedPrimary && storedSecondary ? storedPrimary : rankings[0]?.label || storedPrimary;
  const secondary = storedPrimary && storedSecondary ? storedSecondary : rankings[1]?.label || storedSecondary;
  if (!primary && !secondary) return <p className="text-muted-foreground italic">No ministry approach reflection shared.</p>;
  const tendencyValue = (label: string, value: string) => (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3.5 break-words">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[.08em] text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {MINISTRY_TAGS[value] && (
          <Badge variant="secondary">{MINISTRY_TAGS[value]}</Badge>
        )}
        <span>{value || empty}</span>
      </div>
    </div>
  );
  return <div className="grid sm:grid-cols-2 gap-3"><div>{tendencyValue("Strongest ministry tendency", primary)}</div><div>{tendencyValue("Second ministry tendency", secondary)}</div></div>;
}
export function StrengthsAssessment({ value, isEnabled }: { value: unknown; isEnabled: (subsection: string) => boolean }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const subsectionByStrength: Record<string, string> = { "Relational connection": "relationalConnection", Encouragement: "encouragement", "Teaching and explaining": "teachingExplaining", Listening: "listening", "Leadership and initiative": "leadershipInitiative", Organizing: "organizing", "Creative expression": "creativeExpression", "Problem-solving": "problemSolving", "Practical hands-on work": "practicalHandsOn", Hospitality: "hospitality", "Compassion and care": "compassionCare", "Communication and storytelling": "communicationStorytelling", Discernment: "discernment", "Follow-through": "followThrough", Adaptability: "adaptability", "Mentoring and development": "mentoringDevelopment", "Strategic thinking": "strategicThinking", "Advocacy and justice": "advocacyJustice" };
  const storedSelected = Array.isArray(record.selected) ? record.selected.filter((strength): strength is string => typeof strength === "string" && isEnabled(subsectionByStrength[strength])) : [];
  const selected = storedSelected.length ? storedSelected : rankedApproaches(numericResponses(record.responses), STRENGTH_APPROACHES, isEnabled).slice(0, 5).map(({ label }) => label);
  const notes = Object.values(subsectionByStrength).some(isEnabled) && typeof record.notes === "string" ? record.notes : "";
  if (!selected.length && !notes) return <p className="text-muted-foreground italic">No strengths reflection shared.</p>;
  return <div className="space-y-4">{selected.length > 0 && <div><h3 className="font-medium mb-2">Strengths that stood out</h3><div className="flex flex-wrap gap-2">{selected.map(strength=><Badge key={strength}>{strength}</Badge>)}</div></div>}{notes&&<Value label="Examples shared" value={notes}/>}</div>;
}
export function PersonalityAssessment({ value, isEnabled }: { value: unknown; isEnabled: (subsection: string) => boolean }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const subsectionByLabel: Record<string, string> = { "Social Energy": "socialEnergy", "Decision Lens": "decisionLens", "Planning Style": "planningStyle", "Focus Style": "focusStyle", "Action Style": "actionStyle", "Pace Preference": "pacePreference", "Work Style": "workStyle" };
  const storedDimensions = Array.isArray(record.dimensions) ? record.dimensions.filter((dimension): dimension is Record<string, unknown> => Boolean(dimension) && typeof dimension === "object") : [];
  const storedEnabledDimensions = storedDimensions.filter(dimension=>isEnabled(subsectionByLabel[typeof dimension.label === "string" ? dimension.label : ""]));
  const derivedDimensions = derivedPersonality(numericResponses(record.responses), isEnabled);
  const dimensions = storedEnabledDimensions.length ? storedEnabledDimensions : derivedDimensions;
  if (!dimensions.length) return <p className="text-muted-foreground italic">No personality reflection shared.</p>;
  const summary = typeof record.summary === "string" ? record.summary : derivedDimensions.length ? personalitySummary(derivedDimensions) : "";
  const ministryConnection = typeof record.ministryConnection === "string" ? record.ministryConnection : derivedDimensions.length ? personalityMinistryConnection(derivedDimensions) : "";
 return <div className="space-y-6"><div><h3 className="mb-3 font-medium">How You Tend to Operate</h3><div className="space-y-4">{dimensions.map((dimension,index)=>{const label=typeof dimension.label==="string"?dimension.label:`Dimension ${index+1}`;const left=typeof dimension.left==="string"?dimension.left:"Left";const right=typeof dimension.right==="string"?dimension.right:"Right";const leftPercentage=typeof dimension.leftPercentage==="number"?dimension.leftPercentage:50;const rightPercentage=typeof dimension.rightPercentage==="number"?dimension.rightPercentage:50;const tendency=typeof dimension.tendency==="string"?dimension.tendency:"Balanced";const explanation=typeof dimension.explanation==="string"?dimension.explanation:"";return <div key={label} className="rounded-xl border border-border/60 bg-background/40 p-4"><div className="flex items-center justify-between gap-4"><h4 className="font-medium">{label}</h4><span className="text-xs text-muted-foreground">{tendency}</span></div><div className="mt-3 flex justify-between gap-3 text-xs text-muted-foreground"><span>{left}</span><span className="text-right">{right}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted-foreground/15" role="img" aria-label={`${label}: ${left}, ${right}`}><div className="h-full rounded-full bg-accent/80" style={{width:`${rightPercentage}%`}}/></div>{explanation&&<p className="mt-3 text-sm leading-6">{explanation}</p>}</div>})}</div></div>{summary&&<div><h3 className="mb-2 font-medium">Your Personality at a Glance</h3><p className="text-sm leading-6">{summary}</p></div>}{ministryConnection&&<div><h3 className="mb-2 font-medium">What This May Mean in Ministry</h3><p className="text-sm leading-6">{ministryConnection}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Personality helps describe how you tend to operate, not what God can or cannot call you to do. God often uses both our natural strengths and the areas where He is stretching us.</p></div>}</div>;
}
export function Section({title,children,className}:{title:string;children:React.ReactNode;className?:string}) { return <section className={"space-y-3 print:break-inside-avoid " + (className ?? "")}><h2 className="font-serif text-2xl font-medium tracking-[-.025em]">{title}</h2><Card className="border-border/70 shadow-sm"><CardContent className="p-5 md:p-6">{children}</CardContent></Card></section>; }
function TeamAssignment({ profileId, teamId }: { profileId: number; teamId: number | null }) {
  const queryClient = useQueryClient();
  const { data: teams, isLoading } = useListTeams();
  const updateTeam = useUpdateProfileTeam();
  const [selectedTeamId, setSelectedTeamId] = useState(teamId === null ? "" : String(teamId));
  const activeTeams = teams?.filter((team) => !team.isArchived) ?? [];
  const currentTeam = teams?.find((team) => team.id === teamId);
  const selectedValue = selectedTeamId === "" ? null : Number(selectedTeamId);

  const save = () => {
    updateTeam.mutate(
      { id: profileId, data: { teamId: selectedValue } },
      {
        onSuccess: async (assignment) => {
          queryClient.setQueryData(
            getGetProfileQueryKey(profileId),
            (current: ReturnType<typeof useGetProfile>["data"]) =>
              current ? { ...current, teamId: assignment.teamId } : current,
          );
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() }),
            queryClient.invalidateQueries({
              queryKey: getGetDashboardSummaryQueryKey(),
            }),
            queryClient.invalidateQueries({
              predicate: (query) =>
                String(query.queryKey[0]).startsWith("/api/profiles"),
            }),
          ]);
          toast({
            title: assignment.teamName
              ? `Assigned to ${assignment.teamName}`
              : "Team assignment removed",
          });
        },
        onError: () =>
          toast({
            title: "Unable to update team assignment",
            description: "Please try again.",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Card className="border-primary/20 shadow-sm no-print">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-medium">Current team</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Assignments are pastor-led and can be changed or removed at any time.
          </p>
          <div className="max-w-md space-y-2 pt-1">
            <Label htmlFor="profile-team">Ministry team</Label>
            <select
              id="profile-team"
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              disabled={isLoading || updateTeam.isPending}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Not assigned to a team</option>
              {activeTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
              {currentTeam?.isArchived && (
                <option value={currentTeam.id}>
                  {currentTeam.name} (archived)
                </option>
              )}
            </select>
          </div>
        </div>
        <Button
          onClick={save}
          disabled={isLoading || updateTeam.isPending || selectedValue === teamId}
          className="w-full sm:w-auto"
        >
          {updateTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save assignment
        </Button>
      </CardContent>
    </Card>
  );
}
import type { MinistryProfile } from "@workspace/api-client-react";

function DiscoverProfileView({ profile }: { profile: MinistryProfile }) {
  const answers = (profile.youthResponses || {}) as Record<string, any>;
  const obs = (profile.guardianObservations || {}) as Record<string, any>;

  return (
    <div className="space-y-8 mt-8">
      <Section title="About Me">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Likes for fun" value={Array.isArray(answers.aboutMe?.likes) ? answers.aboutMe?.likes.join(', ') : answers.aboutMe?.likes} />
          <Value label="Good at" value={answers.aboutMe?.goodAt} />
          <Value label="Wants to learn" value={answers.aboutMe?.wantToLearn} />
        </div>
      </Section>

      <Section title="What Sounds Like Me">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Social Energy" value={answers.tendencies?.peopleEnergy} />
          <Value label="New Things" value={answers.tendencies?.newThings} />
          <Value label="Helping Response" value={answers.tendencies?.helpingResponse} />
          <Value label="Enjoys" value={Array.isArray(answers.tendencies?.enjoys) ? answers.tendencies?.enjoys.join(', ') : answers.tendencies?.enjoys} />
        </div>
      </Section>

      <Section title="Caring & Helping">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Cares About" value={Array.isArray(answers.caresAbout) ? answers.caresAbout.join(', ') : answers.caresAbout} />
          <Value label="Likes to Help" value={Array.isArray(answers.waysToHelp) ? answers.waysToHelp.join(', ') : answers.waysToHelp} />
        </div>
      </Section>

      <Section title="Growing With Jesus">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Interests" value={Array.isArray(answers.growingWithJesus?.interests) ? answers.growingWithJesus?.interests.join(', ') : answers.growingWithJesus?.interests} />
          <Value label="Look up to" value={answers.growingWithJesus?.helperName} />
          <Value label="Wants help learning" value={answers.growingWithJesus?.wantsHelpWith} />
        </div>
      </Section>

      <Section title="Things I Would Like To Try">
         <ObjectValues value={answers.opportunities} />
      </Section>

      {Boolean(obs.strengths || obs.comesAlive || obs.comfortableOpportunities || obs.thriveNotes) && (
        <div className="pt-4">
          <h2 className="font-serif text-2xl font-medium mb-3">Guardian Observations</h2>
          <Card className="border-border/60 shadow-sm bg-muted/10">
            <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
              <Value label="Natural strengths" value={obs.strengths} />
              <Value label="Comes alive when" value={obs.comesAlive} />
              <Value label="Comfortable starting opportunities" value={obs.comfortableOpportunities} />
              <Value label="Notes for thriving" value={obs.thriveNotes} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ExploreProfileView({ profile }: { profile: MinistryProfile }) {
  const answers = (profile.youthResponses || {}) as Record<string, any>;
  const obs = (profile.guardianObservations || {}) as Record<string, any>;

  return (
    <div className="space-y-8 mt-8">
      <Section title="About Me">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Likes for fun" value={Array.isArray(answers.aboutMe?.likes) ? answers.aboutMe?.likes.join(', ') : answers.aboutMe?.likes} />
          <Value label="Good at" value={answers.aboutMe?.goodAt} />
          <Value label="Wants to learn" value={answers.aboutMe?.wantToLearn} />
        </div>
      </Section>

      <Section title="How I Tend to Operate">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Social Energy" value={answers.howITendToOperate?.peopleEnergy} />
          <Value label="Decision Style" value={answers.howITendToOperate?.decisionStyle} />
          <Value label="Planning Style" value={answers.howITendToOperate?.planningStyle} />
          <Value label="Focus Style" value={answers.howITendToOperate?.focusStyle} />
          <Value label="Action Style" value={answers.howITendToOperate?.actionStyle} />
          <Value label="Reflection" value={answers.howITendToOperate?.reflection} />
        </div>
      </Section>

      <Section title="Caring & Helping">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="People & Needs" value={Array.isArray(answers.peopleAndNeeds) ? answers.peopleAndNeeds.join(', ') : answers.peopleAndNeeds} />
          <Value label="Ways I Enjoy Helping" value={Array.isArray(answers.waysIEnjoyHelping) ? answers.waysIEnjoyHelping.join(', ') : answers.waysIEnjoyHelping} />
        </div>
      </Section>

      <Section title="Growing With Jesus">
        <div className="grid sm:grid-cols-2 gap-3">
          <Value label="Interests" value={Array.isArray(answers.growingWithJesus?.interests) ? answers.growingWithJesus?.interests.join(', ') : answers.growingWithJesus?.interests} />
          <Value label="Look up to" value={answers.growingWithJesus?.helperName} />
          <Value label="Wants help learning" value={answers.growingWithJesus?.wantsHelpWith} />
        </div>
      </Section>

      <Section title="Things I Would Like To Try">
         <ObjectValues value={answers.opportunities} />
      </Section>

      {Boolean(obs.strengths || obs.comesAlive || obs.comfortableOpportunities || obs.thriveNotes) && (
        <div className="pt-4">
          <h2 className="font-serif text-2xl font-medium mb-3">Guardian Observations</h2>
          <Card className="border-border/60 shadow-sm bg-muted/10">
            <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
              <Value label="Natural strengths" value={obs.strengths} />
              <Value label="Comes alive when" value={obs.comesAlive} />
              <Value label="Comfortable starting opportunities" value={obs.comfortableOpportunities} />
              <Value label="Notes for thriving" value={obs.thriveNotes} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DevelopProfileView({ profile }: { profile: MinistryProfile }) {
  const answers = (profile.youthResponses || {}) as Record<string, any>;
  const obs = (profile.guardianObservations || {}) as Record<string, any>;
  const values = (value: unknown) => Array.isArray(value) ? value.join(", ") : value;
  const operationLabels: Record<string, string> = {
    peopleEnergy: "People energy", processingStyle: "Processing style", planningStyle: "Planning style",
    peopleLogic: "What they notice", actionReflection: "Action & reflection", leadershipSupport: "Leadership & support",
    conflictStyle: "Conflict approach", teamPreference: "Team preference",
  };
  const opportunityLabels: Record<string, string> = {
    welcome: "Welcoming people", prayer: "Prayer", kids: "Helping younger children", students: "Student ministry",
    worship: "Worship or music", production: "Tech or production", scriptureReading: "Reading Scripture",
    communityCare: "Community care", missions: "Missions and outreach", creative: "Creative projects",
    events: "Church events", behindTheScenes: "Behind-the-scenes support",
  };
  return <div className="mt-8 space-y-8">
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
      Youth profile: teen answers and guardian observations are shown separately. Develop profiles are private, conversation-oriented records and cannot be assigned to teams or used for adult matching.
    </div>
    <Section title="Prayer & Calling"><Value label="Reflection" value={answers.prayerAndCalling?.reflection} /></Section>
    <Section title="About Me"><div className="grid gap-3 sm:grid-cols-2"><Value label="Enjoys" value={values(answers.aboutMe?.likes)} /><Value label="Naturally good at" value={answers.aboutMe?.goodAt} /><Value label="Wants to learn" value={answers.aboutMe?.wantToLearn} /></div></Section>
    <Section title="How I Tend to Operate"><div className="grid gap-3 sm:grid-cols-2">{Object.entries(operationLabels).map(([key, label]) => <Value key={key} label={label} value={answers.howITendToOperate?.[key]} />)}</div><p className="mt-4 text-sm text-muted-foreground">Flexible self-reflection, not a type, diagnosis, score, or placement recommendation.</p></Section>
    <Section title="Gifts You May Want to Explore Further"><Value label="Areas of interest" value={values(answers.giftsToExplore?.interests)} /><Value label="Why they are interesting" value={answers.giftsToExplore?.reflection} /></Section>
    <Section title="Passions"><Value label="People and causes" value={values(answers.passions?.peopleAndCauses)} /><Value label="Why this matters" value={answers.passions?.reflection} /></Section>
    <Section title="Growing With Jesus"><div className="grid gap-3 sm:grid-cols-2"><Value label="Interests" value={values(answers.growingWithJesus?.interests)} /><Value label="Trusted helper" value={answers.growingWithJesus?.helperName} /><Value label="Wants help with" value={answers.growingWithJesus?.wantsHelpWith} /></div></Section>
    <Section title="Calling & Purpose"><Value label="What matters" value={answers.callingAndPurpose?.whatMatters} /><Value label="Future hope" value={answers.callingAndPurpose?.futureHope} /><Value label="Calling reflection" value={answers.callingAndPurpose?.callingReflection} /></Section>
    <Section title="Ministry Interests"><ObjectValues value={answers.ministryInterests} labels={opportunityLabels} /></Section>
    <Section title="Availability & Responsibility"><div className="grid gap-3 sm:grid-cols-2"><Value label="Availability" value={answers.availabilityAndResponsibility?.availability} /><Value label="Responsibility style" value={answers.availabilityAndResponsibility?.responsibilityStyle} /><Value label="Notes" value={answers.availabilityAndResponsibility?.notes} /></div></Section>
    <Section title="My Development Plan"><Value label="Goal" value={answers.developmentPlan?.goal} /><Value label="Next steps" value={values(answers.developmentPlan?.nextSteps)} /><Value label="Support needed" value={answers.developmentPlan?.supportNeeded} /></Section>
    {Boolean(obs.strengths || obs.comesAlive || obs.comfortableOpportunities || obs.thriveNotes) && <div><h2 className="mb-3 font-serif text-2xl font-medium">Guardian Observations</h2><Card className="border-border/60 bg-muted/10 shadow-sm"><CardContent className="grid gap-4 p-5 sm:grid-cols-2"><Value label="Natural strengths" value={obs.strengths} /><Value label="Comes alive when" value={obs.comesAlive} /><Value label="Comfortable starting opportunities" value={obs.comfortableOpportunities} /><Value label="Notes for thriving" value={obs.thriveNotes} /></CardContent></Card></div>}
  </div>;
}

import { MyMinistryProfile } from "@/components/profile/my-ministry-profile";
import { LeaderMinistryProfile } from "@/components/profile/leader-ministry-profile";

function AdultProfileView({
  profile,
  isPrinting,
  sectionEnabled,
  subsectionEnabled,
}: {
  profile: MinistryProfile;
  isPrinting: boolean;
  sectionEnabled: (section: string) => boolean;
  subsectionEnabled: (section: string, subsection: string) => boolean;
}) {
  const [view, setView] = useState<"individual" | "leader">("individual");

  if (isPrinting) {
    return (
      <MyMinistryProfile
        profile={profile}
        isPrinting
        sectionEnabled={sectionEnabled}
        subsectionEnabled={subsectionEnabled}
      />
    );
  }

  return (
    <>
      {!isPrinting && (
        <div className="flex flex-wrap gap-6 border-b border-border/60 pb-2 mt-8 mb-6 no-print">
          <button 
            className={`font-serif text-2xl font-medium tracking-tight pb-2 -mb-[10px] ${view === 'individual' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'}`}
            onClick={() => setView('individual')}
          >
            My Ministry Profile
          </button>
          <button 
            className={`font-serif text-2xl font-medium tracking-tight pb-2 -mb-[10px] ${view === 'leader' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'}`}
            onClick={() => setView('leader')}
          >
            Ministry Leader View
          </button>
        </div>
      )}

      {view === 'individual' ? (
        <MyMinistryProfile
          profile={profile}
          isPrinting={isPrinting}
          sectionEnabled={sectionEnabled}
          subsectionEnabled={subsectionEnabled}
        />
      ) : (
        <>
          {!isPrinting && <ProfileHelper profileId={profile.id} memberName={profile.memberName} />}
          {!isPrinting && <CoordinatorAsk profile={profile} />}
          {!isPrinting && <TeamAssignment profileId={profile.id} teamId={profile.teamId} />}
          {!isPrinting && <ProfileSchedule profileId={profile.id} />}
          <LeaderMinistryProfile profile={profile} isPrinting={isPrinting} sectionEnabled={sectionEnabled} subsectionEnabled={subsectionEnabled} />
        </>
      )}
    </>
  );
}

export default function ProfileDetail() {
 const [,params]=useRoute("/profiles/:id"); const id=params?.id?Number(params.id):0; const {data:profile,isLoading,error}=useGetProfile(id,{query:{enabled:!!id,queryKey:getGetProfileQueryKey(id)}});
 const [journeyCopied, setJourneyCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  useEffect(() => {
    const beginPrint = () => flushSync(() => setIsPrinting(true));
    const endPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", beginPrint);
    window.addEventListener("afterprint", endPrint);
    return () => {
      window.removeEventListener("beforeprint", beginPrint);
      window.removeEventListener("afterprint", endPrint);
    };
  }, []);
  const printProfile = () => {
    flushSync(() => setIsPrinting(true));
    window.print();
  };
 if(error)return <div className="container p-8"><p className="text-destructive">Failed to load profile details.</p><Link href="/profiles">Back to profiles</Link></div>;
 if(isLoading||!profile)return <div className="container p-8"><div className="h-48 animate-pulse rounded bg-muted"/></div>;
   const basic=profile.basicInformation; const connection=profile.churchConnection; const skills=profile.skills; const skillDetails = skills.details && typeof skills.details === "object" && !Array.isArray(skills.details) ? skills.details as Record<string, unknown> : null; const hasConversationSkills = Boolean(skillDetails && ("context" in skillDetails || "training" in skillDetails || "enjoys" in skillDetails)); const configuration=profile.assessmentConfiguration;
  const sectionEnabled=(section: keyof typeof configuration.sections)=>configuration.sections[section];
  const subsectionEnabled=(section: string, subsection: string)=>configuration.subsections[`${section}.${subsection}` as keyof typeof configuration.subsections];
  return <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8 print:max-w-none print:p-0">
   {!isPrinting&&<div className="no-print flex justify-between"><Button variant="ghost" asChild><Link href="/profiles"><ArrowLeft className="mr-2 h-4 w-4"/>Back</Link></Button><Button variant="outline" onClick={printProfile}><Printer className="mr-2 h-4 w-4"/>Print profile</Button></div>}
     <header className={`overflow-hidden rounded-[1.5rem] border border-primary/15 bg-card p-7 shadow-sm md:p-10 ${profile.profileType === "adult" ? "print:hidden" : ""}`}>
      <div className="brand-rule -mx-7 -mt-7 mb-7 h-1 md:-mx-10 md:-mt-10" aria-hidden="true" />
       <ChurchProfileBranding branding={profile.branding} className="mb-7" />
     {profile.profileType !== 'adult' && (
        <Badge className="mb-4 bg-secondary/25 text-foreground hover:bg-secondary/30 capitalize">
         {profile.profileType} Pathway (Age {profile.age})
       </Badge>
     )}
     <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4"><ProfileAvatar name={profile.memberName} photoUrl={profile.profilePhotoUrl} className="h-16 w-16 text-xl" /><div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-accent">Ministry profile</p><h1 className="font-serif text-4xl tracking-[-.04em]">{profile.memberName}</h1><p className="mt-1 text-muted-foreground">Completed {new Date(profile.completedAt).toLocaleDateString()}</p></div></div>
       {!isPrinting&&<div className="flex flex-wrap gap-2 no-print">
         <Button variant="outline" asChild><Link href={`/profiles/${profile.id}/journey`}><Compass className="h-4 w-4" />View journey</Link></Button>
         {profile.journeyToken && <Button variant="ghost" onClick={() => { const url = `${window.location.origin}${import.meta.env.BASE_URL}journey/${profile.journeyToken}`; void navigator.clipboard?.writeText(url); setJourneyCopied(true); window.setTimeout(() => setJourneyCopied(false), 1800); }}>{journeyCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{journeyCopied ? "Copied" : "Copy private link"}</Button>}
       </div>}
     </div>
      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <a className="flex items-center gap-2 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`mailto:${profile.email}`} aria-label={`Email ${profile.memberName}`}><Mail className="h-4 w-4"/>{profile.email}</a>
        {basic?.phone && <a className="flex items-center gap-2 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`tel:${basic.phone}`} aria-label={`Call ${profile.memberName}`}><Phone className="h-4 w-4"/>{basic.phone}</a>}
     </div>
   </header>

   {profile.profileType === 'discover' ? (
     <DiscoverProfileView profile={profile} />
   ) : profile.profileType === 'explore' ? (
     <ExploreProfileView profile={profile} />
    ) : profile.profileType === 'develop' ? (
      <DevelopProfileView profile={profile} />
   ) : (
     <AdultProfileView 
       profile={profile} 
       isPrinting={isPrinting} 
       sectionEnabled={sectionEnabled} 
       subsectionEnabled={subsectionEnabled} 
     />
   )}
 </div>;
}