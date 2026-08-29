import { useState } from "react";
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
import { ArrowLeft, Loader2, Mail, Phone, Printer, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const empty = "Not shared";
const spiritualGiftMeanings: Record<string, string> = {
  "Administration":"organizing people, resources, and systems effectively", "Apostleship":"pioneering, starting, expanding, and establishing new ministries or works", "Discernment of Spirits":"recognizing what is from God, human influence, or spiritual deception", "Evangelism":"communicating the gospel and helping people respond to Jesus", "Exhortation / Encouragement":"strengthening, motivating, comforting, and challenging others", "Faith":"unusual confidence in God’s power, promises, and provision", "Giving":"generously and joyfully sharing resources to advance God’s work and meet needs", "Healing":"being used by God as an instrument of physical, emotional, or spiritual healing", "Helps / Service":"meeting practical needs and supporting others so ministry can happen", "Hospitality":"welcoming people and creating environments where others feel received and cared for", "Interpretation of Tongues":"interpreting a message spoken in tongues", "Knowledge":"understanding and communicating spiritual truth or insight", "Leadership":"providing direction, motivating others, and helping a group move toward God-given goals", "Mercy":"compassionately caring for people who are hurting, struggling, marginalized, or in need", "Miracles":"being used by God in extraordinary demonstrations of His power", "Pastoring / Shepherding":"caring for, protecting, guiding, and nurturing people spiritually", "Prophecy":"communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction", "Teaching":"explaining and applying biblical truth so others understand and grow", "Tongues":"speaking in a language or spiritual utterance given through the Holy Spirit", "Wisdom":"applying spiritual truth appropriately to real situations", "Craftsmanship":"using artistic or practical skill for God’s purposes", "Intercession":"persistent, focused prayer for others", "Missionary / Cross-Cultural Ministry":"effectively ministering across cultures and communities", "Music / Worship":"using musical ability to lead and encourage worship", "Celibacy":"a particular grace for remaining unmarried for undivided devotion to ministry", "Voluntary Poverty":"willingly living with less in order to serve God and others",
};
const responseLabels = ["", "Not at all", "A little", "Sometimes", "Often", "Very much"];
const MINISTRY_APPROACHES = [
  ["builder", "Starting and building new ministry"], ["insight", "Noticing what needs attention"], ["connector", "Connecting people with faith"], ["caregiver", "Caring for people over time"], ["teacher", "Making ideas clear"],
] as const;
const STRENGTH_APPROACHES = [
  ["relationalConnection", "Relational connection"], ["encouragement", "Encouragement"], ["teachingExplaining", "Teaching and explaining"], ["listening", "Listening"], ["leadershipInitiative", "Leadership and initiative"], ["organizing", "Organizing"], ["creativeExpression", "Creative expression"], ["problemSolving", "Problem-solving"], ["practicalHandsOn", "Practical hands-on work"], ["hospitality", "Hospitality"], ["compassionCare", "Compassion and care"], ["communicationStorytelling", "Communication and storytelling"], ["discernment", "Discernment"], ["followThrough", "Follow-through"], ["adaptability", "Adaptability"], ["mentoringDevelopment", "Mentoring and development"], ["strategicThinking", "Strategic thinking"], ["advocacyJustice", "Advocacy and justice"],
] as const;
const PERSONALITY_DIMENSIONS = [
  ["socialEnergy", "Social Energy", "Reflective", "Interactive", "You tend to process internally and may recharge through quieter environments, deeper conversations, or time alone.", "You tend to process through interaction and may gain energy through conversation, activity, and being around others.", "thoughtful and reflective", "energized by interaction", "how you connect with people and communicate in groups"],
  ["decisionLens", "Decision Lens", "Relational", "Principled", "You naturally consider people, relationships, compassion, emotional impact, and how others will be affected.", "You naturally consider logic, consistency, fairness, standards, facts, and what solution makes the most sense.", "relationship-aware", "principled and consistent", "how you weigh people, compassion, fairness, and consistency when making decisions"],
  ["planningStyle", "Planning Style", "Adaptive", "Settled", "You may enjoy flexibility, keeping options open, adjusting as you go, and responding to changing circumstances.", "You may prefer clear expectations, schedules, deadlines, decisions, and knowing what comes next.", "flexible and adaptive", "prepared and settled", "how you respond to change and how much structure helps you serve well"],
  ["focusStyle", "Focus Style", "Detail", "Big Picture", "You tend to notice practical needs, specific information, logistics, steps, and what needs attention right now.", "You tend to notice patterns, possibilities, future direction, ideas, connections, and what something could become.", "attentive to detail", "big-picture oriented", "whether you naturally begin with practical details or broader direction"],
  ["actionStyle", "Action Style", "Support", "Initiate", "You may naturally strengthen, improve, assist, maintain, and help existing efforts succeed.", "You may naturally start things, suggest new approaches, create momentum, and move ideas into action.", "supportive and strengthening", "initiative-taking", "whether you are most energized by strengthening existing work or starting something new"],
  ["pacePreference", "Pace Preference", "Steady", "Dynamic", "You may thrive with consistency, predictable rhythms, focused responsibilities, and sustainable routines.", "You may enjoy variety, change, multiple responsibilities, urgency, and fast-moving environments.", "steady and sustainable", "dynamic and responsive", "what rhythms, pace, and level of change help you remain engaged"],
  ["workStyle", "Work Style", "Independent", "Collaborative", "You may enjoy autonomy, focused responsibility, personal ownership, and being trusted to complete a task.", "You may enjoy shared responsibility, brainstorming, interaction, feedback, and accomplishing things together.", "self-directed", "collaborative", "how you handle responsibility, feedback, teamwork, and shared ownership"],
] as const;
type PersonalityDimension = { label: string; left: string; right: string; leftPercentage: number; rightPercentage: number; tendency: string; explanation: string; dominant: "left" | "right" | "balanced"; leftSummary: string; rightSummary: string; ministry: string };
function numericResponses(value: unknown) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(record).filter(([, response]) => typeof response === "number" && Number.isFinite(response))) as Record<string, number>;
}
function rankedApproaches(responses: Record<string, number>, approaches: readonly (readonly [string, string])[], isEnabled: (key: string) => boolean) {
  return approaches.filter(([key]) => isEnabled(key) && Object.keys(responses).some(responseKey => new RegExp(`^${key}-\\d+$`).test(responseKey))).map(([key, label]) => ({ label, score: Object.entries(responses).reduce((total, [responseKey, response]) => new RegExp(`^${key}-\\d+$`).test(responseKey) ? total + response : total, 0) })).sort((a, b) => b.score - a.score);
}
function derivedPersonality(responses: Record<string, number>, isEnabled: (key: string) => boolean): PersonalityDimension[] {
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
  return descriptors.length ? `You tend to operate as a ${descriptors.join(", ")} person. These tendencies may shape ${nonBalanced.slice(0, 2).map(result => result.ministry).join(" and ")}.` : "You tend to draw from both sides of these dimensions, adapting your approach to the people and situations around you.";
}
function personalityMinistryConnection(results: PersonalityDimension[]) {
  const tendencies = results.filter(result => result.dominant !== "balanced").slice(0, 3).map(result => result.dominant === "left" ? result.leftSummary : result.rightSummary);
  return tendencies.length ? `In ministry, your ${tendencies.join(", ")} tendencies may influence how you interact with people, communicate, respond to change, make decisions, and handle responsibility. You may feel most energized in environments that fit your natural rhythms while also leaving room for God to stretch you.` : "In ministry, your balanced tendencies may help you adapt across different people, teams, rhythms, and responsibilities.";
}
function ResponseLabel({ value }: { value: unknown }) {
  return <span className="text-muted-foreground">{typeof value === "number" ? responseLabels[value] || "Response shared" : "Response shared"}</span>;
}
function SpiritualGifts({ value }: { value: unknown }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const topGifts = Array.isArray(record.topGifts) ? record.topGifts.filter((gift): gift is string => typeof gift === "string") : [];
  const responses = record.responses && typeof record.responses === "object" ? record.responses as Record<string, unknown> : {};
  if (!topGifts.length && !Object.keys(responses).length) return <p className="text-muted-foreground italic">No spiritual gifts reflection shared.</p>;
  return <div className="space-y-5">{topGifts.length > 0 && <div><h3 className="font-medium mb-2">Gifts selected for conversation</h3><div className="space-y-2">{topGifts.map(gift=><div key={gift} className="rounded-lg border border-border/60 p-3"><strong>{gift}</strong><p className="text-sm text-muted-foreground mt-1">{spiritualGiftMeanings[gift] || "Member-selected gift for pastoral conversation."}</p></div>)}</div></div>}{Object.keys(responses).length > 0 && <div><h3 className="font-medium mb-2">Reflection responses</h3><div className="space-y-3">{Object.entries(responses).map(([gift,response])=><div key={gift} className="rounded-lg border border-border/60 p-3"><div className="text-sm font-medium">{gift}</div>{Array.isArray(response) ? <ol className="mt-2 space-y-2 text-sm">{response.map((entry,index)=>{const reflection=entry && typeof entry === "object" ? entry as Record<string, unknown> : {}; return <li key={index}><p>{typeof reflection.prompt === "string" ? reflection.prompt : `Reflection question ${index + 1}`}</p><ResponseLabel value={reflection.response}/></li>;})}</ol> : <div className="text-sm"><ResponseLabel value={response}/></div>}</div>)}</div></div>}</div>;
}
function Value({ label, value }: {label:string;value: unknown}) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return <div className="rounded-lg border border-border/60 bg-card p-3 break-words"><div className="text-xs font-medium text-muted-foreground mb-1">{label}</div><div className={text ? "" : "text-muted-foreground italic"}>{text || empty}</div></div>;
}
function ObjectValues({ value }: {value: unknown}) {
  if (!value || typeof value !== "object") return <p className="text-muted-foreground italic">No details shared.</p>;
  const entries = Object.entries(value as Record<string, unknown>).filter(([,v]) => v !== null && v !== "" && (!Array.isArray(v) || v.length));
  if (!entries.length) return <p className="text-muted-foreground italic">No details shared.</p>;
  return <div className="grid sm:grid-cols-2 gap-3">{entries.map(([key,val]) => <Value key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./,x=>x.toUpperCase())} value={Array.isArray(val) ? val.join(", ") : typeof val === "object" ? JSON.stringify(val) : val}/>)}</div>;
}
function MinistryAssessment({ value, isEnabled }: { value: unknown; isEnabled: (subsection: string) => boolean }) {
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
  return <div className="grid sm:grid-cols-2 gap-3"><Value label="Strongest ministry tendency" value={primary}/><Value label="Second ministry tendency" value={secondary}/></div>;
}
function StrengthsAssessment({ value, isEnabled }: { value: unknown; isEnabled: (subsection: string) => boolean }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const subsectionByStrength: Record<string, string> = { "Relational connection": "relationalConnection", Encouragement: "encouragement", "Teaching and explaining": "teachingExplaining", Listening: "listening", "Leadership and initiative": "leadershipInitiative", Organizing: "organizing", "Creative expression": "creativeExpression", "Problem-solving": "problemSolving", "Practical hands-on work": "practicalHandsOn", Hospitality: "hospitality", "Compassion and care": "compassionCare", "Communication and storytelling": "communicationStorytelling", Discernment: "discernment", "Follow-through": "followThrough", Adaptability: "adaptability", "Mentoring and development": "mentoringDevelopment", "Strategic thinking": "strategicThinking", "Advocacy and justice": "advocacyJustice" };
  const storedSelected = Array.isArray(record.selected) ? record.selected.filter((strength): strength is string => typeof strength === "string" && isEnabled(subsectionByStrength[strength])) : [];
  const selected = storedSelected.length ? storedSelected : rankedApproaches(numericResponses(record.responses), STRENGTH_APPROACHES, isEnabled).slice(0, 5).map(({ label }) => label);
  const notes = Object.values(subsectionByStrength).some(isEnabled) && typeof record.notes === "string" ? record.notes : "";
  if (!selected.length && !notes) return <p className="text-muted-foreground italic">No strengths reflection shared.</p>;
  return <div className="space-y-4">{selected.length > 0 && <div><h3 className="font-medium mb-2">Strengths that stood out</h3><div className="flex flex-wrap gap-2">{selected.map(strength=><Badge key={strength}>{strength}</Badge>)}</div></div>}{notes&&<Value label="Examples shared" value={notes}/>}</div>;
}
function PersonalityAssessment({ value, isEnabled }: { value: unknown; isEnabled: (subsection: string) => boolean }) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const subsectionByLabel: Record<string, string> = { "Social Energy": "socialEnergy", "Decision Lens": "decisionLens", "Planning Style": "planningStyle", "Focus Style": "focusStyle", "Action Style": "actionStyle", "Pace Preference": "pacePreference", "Work Style": "workStyle" };
  const storedDimensions = Array.isArray(record.dimensions) ? record.dimensions.filter((dimension): dimension is Record<string, unknown> => Boolean(dimension) && typeof dimension === "object") : [];
  const storedEnabledDimensions = storedDimensions.filter(dimension=>isEnabled(subsectionByLabel[typeof dimension.label === "string" ? dimension.label : ""]));
  const derivedDimensions = derivedPersonality(numericResponses(record.responses), isEnabled);
  const dimensions = storedEnabledDimensions.length ? storedEnabledDimensions : derivedDimensions;
  if (!dimensions.length) return <p className="text-muted-foreground italic">No personality reflection shared.</p>;
  const summary = typeof record.summary === "string" ? record.summary : derivedDimensions.length ? personalitySummary(derivedDimensions) : "";
  const ministryConnection = typeof record.ministryConnection === "string" ? record.ministryConnection : derivedDimensions.length ? personalityMinistryConnection(derivedDimensions) : "";
  return <div className="space-y-6"><div><h3 className="font-medium mb-3">How You Tend to Operate</h3><div className="space-y-4">{dimensions.map((dimension,index)=>{const label=typeof dimension.label==="string"?dimension.label:`Dimension ${index+1}`;const left=typeof dimension.left==="string"?dimension.left:"Left";const right=typeof dimension.right==="string"?dimension.right:"Right";const leftPercentage=typeof dimension.leftPercentage==="number"?dimension.leftPercentage:50;const rightPercentage=typeof dimension.rightPercentage==="number"?dimension.rightPercentage:50;const tendency=typeof dimension.tendency==="string"?dimension.tendency:"Balanced";const explanation=typeof dimension.explanation==="string"?dimension.explanation:"";return <div key={label} className="rounded-lg border border-border/60 p-4"><div className="flex items-center justify-between gap-4"><h4 className="font-medium">{label}</h4><span className="text-xs text-muted-foreground">{tendency}</span></div><div className="flex justify-between gap-3 text-xs text-muted-foreground mt-3"><span>{left} — {leftPercentage}%</span><span className="text-right">{right} — {rightPercentage}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/15"><div className="h-full rounded-full bg-primary" style={{width:`${rightPercentage}%`}}/></div>{explanation&&<p className="text-sm leading-6 mt-3">{explanation}</p>}</div>})}</div></div>{summary&&<div><h3 className="font-medium mb-2">Your Personality at a Glance</h3><p className="text-sm leading-6">{summary}</p></div>}{ministryConnection&&<div><h3 className="font-medium mb-2">What This May Mean in Ministry</h3><p className="text-sm leading-6">{ministryConnection}</p><p className="text-sm text-muted-foreground leading-6 mt-3">Personality helps describe how you tend to operate, not what God can or cannot call you to do. God often uses both our natural strengths and the areas where He is stretching us.</p></div>}</div>;
}
function Section({title,children}:{title:string;children:React.ReactNode}) { return <section className="space-y-3 print:break-inside-avoid"><h2 className="font-serif text-2xl font-medium">{title}</h2><Card className="border-border/60 shadow-sm"><CardContent className="p-5">{children}</CardContent></Card></section>; }
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
export default function ProfileDetail() {
 const [,params]=useRoute("/profiles/:id"); const id=params?.id?Number(params.id):0; const {data:profile,isLoading,error}=useGetProfile(id,{query:{enabled:!!id,queryKey:getGetProfileQueryKey(id)}});
 if(error)return <div className="container p-8"><p className="text-destructive">Failed to load profile details.</p><Link href="/profiles">Back to profiles</Link></div>;
 if(isLoading||!profile)return <div className="container p-8"><div className="h-48 animate-pulse rounded bg-muted"/></div>;
  const basic=profile.basicInformation; const connection=profile.churchConnection; const skills=profile.skills; const configuration=profile.assessmentConfiguration;
  const sectionEnabled=(section: keyof typeof configuration.sections)=>configuration.sections[section];
  const subsectionEnabled=(section: string, subsection: string)=>configuration.subsections[`${section}.${subsection}` as keyof typeof configuration.subsections];
 return <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8 print:max-w-none print:p-0">
  <div className="flex justify-between no-print"><Button variant="ghost" asChild><Link href="/profiles"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Link></Button><Button variant="outline" onClick={()=>window.print()}><Printer className="w-4 h-4 mr-2"/>Print profile</Button></div>
   <header className="rounded-2xl border bg-card p-7 md:p-10"><h1 className="font-serif text-4xl">{profile.memberName}</h1><p className="text-muted-foreground mt-1">Completed {new Date(profile.completedAt).toLocaleDateString()}</p><div className="flex flex-wrap gap-4 mt-5 text-sm"><a className="flex gap-2 hover:text-primary" href={`mailto:${profile.email}`}><Mail className="w-4 h-4"/>{profile.email}</a>{basic.phone&&<a className="flex gap-2 hover:text-primary" href={`tel:${basic.phone}`}><Phone className="w-4 h-4"/>{basic.phone}</a>}</div></header>
   <TeamAssignment profileId={profile.id} teamId={profile.teamId} />
   <div className="space-y-8">
     {sectionEnabled("aboutYou")&&<Section title="About You"><div className="space-y-6">{subsectionEnabled("aboutYou","personalInformation")&&<div><h3 className="font-medium mb-2">Personal information</h3><div className="grid sm:grid-cols-2 gap-3"><Value label="Age range" value={basic.ageRange}/><Value label="Preferred contact" value={basic.preferredContact}/><Value label="Family situation" value={basic.familySituation}/><Value label="Transportation" value={basic.transportation}/></div><div className="mt-3"><ObjectValues value={basic.languages}/></div></div>}{subsectionEnabled("aboutYou","skillsExperience")&&<div><h3 className="font-medium mb-2">Skills & experience</h3><div className="grid sm:grid-cols-2 gap-3"><Value label="Occupation" value={skills.occupation}/><Value label="Unique skill" value={skills.uniqueSkills}/><Value label="Previous ministry experience" value={skills.previousMinistryExperience}/><Value label="Leadership experience" value={skills.leadershipExperience}/><Value label="Mission trip experience" value={skills.missionTripExperience}/></div><div className="mt-3"><ObjectValues value={skills.details}/></div></div>}{subsectionEnabled("aboutYou","lifeExperiences")&&<div><h3 className="font-medium mb-2">Life experiences</h3><p className="text-sm text-muted-foreground mb-3">Shared voluntarily; please handle with care and discretion.</p><ObjectValues value={profile.lifeExperiences}/></div>}</div></Section>}
     {sectionEnabled("apest")&&<Section title="How you minister"><p className="text-sm text-muted-foreground mb-3">Member self-reflection, not a diagnosis, score, or placement recommendation.</p><MinistryAssessment value={profile.assessmentSections.apest} isEnabled={subsection=>subsectionEnabled("apest",subsection)}/></Section>}
     {sectionEnabled("spiritualGifts")&&<Section title="How God has gifted you (Spiritual Gifts)"><p className="text-sm text-muted-foreground mb-3">Member self-reflection, not a diagnosis or placement recommendation.</p><SpiritualGifts value={profile.assessmentSections.spiritualGifts}/></Section>}
     {sectionEnabled("passionsInterests")&&<Section title="Who and where you are drawn toward (Passions)"><div className="space-y-5">{subsectionEnabled("passionsInterests","passions")&&<div><h3 className="font-medium mb-2">Passions</h3><div className="flex flex-wrap gap-2">{profile.passions.length ? profile.passions.map(x=><Badge key={x}>{x}</Badge>) : <span className="italic text-muted-foreground">No passions shared.</span>}</div></div>}{subsectionEnabled("passionsInterests","ministryInterests")&&<div><h3 className="font-medium mb-2">Ministry interests</h3><div className="flex flex-wrap gap-2">{profile.interests.length ? profile.interests.map(x=><Badge key={x} variant="outline">{x}</Badge>) : <span className="italic text-muted-foreground">No interests shared.</span>}</div></div>}</div></Section>}
     {sectionEnabled("naturalStrengths")&&<Section title="What you naturally do well (Strengths)"><p className="text-sm text-muted-foreground mb-3">Strengths-based self-reflection for conversation, not a branded test, diagnosis, or automatic placement recommendation.</p><StrengthsAssessment value={profile.assessmentSections.naturalStrengths} isEnabled={subsection=>subsectionEnabled("naturalStrengths",subsection)}/></Section>}
     {sectionEnabled("personalityStrengths")&&<Section title="Personality"><div className="space-y-5"><div><p className="text-sm text-muted-foreground mb-3">Original ministry-focused self-reflection, not a rigid personality type, diagnosis, or statement about calling.</p><PersonalityAssessment value={profile.assessmentSections.personalityStrengths} isEnabled={subsection=>subsectionEnabled("personalityStrengths",subsection)}/></div>{subsectionEnabled("personalityStrengths","ministryPreferences")&&<div><h3 className="font-medium mb-2">Ministry preferences & environment</h3><ObjectValues value={profile.ministryPreferences}/></div>}</div></Section>}
     {sectionEnabled("spiritualHealth")&&<Section title="How you are doing (Spiritual Health)"><p className="text-sm text-muted-foreground mb-3">Pastoral self-reflection only, never a pass/fail measure.</p><ObjectValues value={profile.assessmentSections.spiritualHealth}/></Section>}
     {sectionEnabled("connectionAvailability")&&<Section title="How you are connected"><div className="space-y-5">{subsectionEnabled("connectionAvailability","churchConnection")&&<div><h3 className="font-medium mb-2">Church connection</h3><div className="grid sm:grid-cols-2 gap-3"><Value label="Attending" value={connection.attendanceLength}/><Value label="Following Jesus" value={connection.followingJesusLength}/><Value label="Connection level (self-reported)" value={connection.connectionLevel}/><Value label="Served here before" value={connection.servedBefore ? "Yes" : "No"}/><Value label="Prior service" value={connection.previousService}/></div><div className="mt-3"><ObjectValues value={connection.details}/></div></div>}{subsectionEnabled("connectionAvailability","availability")&&<div><h3 className="font-medium mb-2">Current availability and serving</h3><div className="grid sm:grid-cols-2 gap-3"><Value label="Frequency" value={profile.servingFrequency}/><Value label="Times" value={profile.availability.join(", ")}/></div><div className="mt-3"><ObjectValues value={profile.availabilityDetails}/></div></div>}</div></Section>}
   </div>
 </div>;
}