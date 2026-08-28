import { useRoute, Link } from "wouter";
import { useGetProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Mail, Phone, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const empty = "Not shared";
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
function Section({title,children}:{title:string;children:React.ReactNode}) { return <section className="space-y-3 print:break-inside-avoid"><h2 className="font-serif text-2xl font-medium">{title}</h2><Card className="border-border/60 shadow-sm"><CardContent className="p-5">{children}</CardContent></Card></section>; }
export default function ProfileDetail() {
 const [,params]=useRoute("/profiles/:id"); const id=params?.id?Number(params.id):0; const {data:profile,isLoading,error}=useGetProfile(id,{query:{enabled:!!id,queryKey:getGetProfileQueryKey(id)}});
 if(error)return <div className="container p-8"><p className="text-destructive">Failed to load profile details.</p><Link href="/profiles">Back to profiles</Link></div>;
 if(isLoading||!profile)return <div className="container p-8"><div className="h-48 animate-pulse rounded bg-muted"/></div>;
 const basic=profile.basicInformation; const connection=profile.churchConnection; const skills=profile.skills;
 return <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8 print:max-w-none print:p-0">
  <div className="flex justify-between no-print"><Button variant="ghost" asChild><Link href="/profiles"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Link></Button><Button variant="outline" onClick={()=>window.print()}><Printer className="w-4 h-4 mr-2"/>Print profile</Button></div>
  <header className="rounded-2xl border bg-card p-7 md:p-10"><h1 className="font-serif text-4xl">{profile.memberName}</h1><p className="text-muted-foreground mt-1">Completed {new Date(profile.completedAt).toLocaleDateString()}</p><div className="flex flex-wrap gap-4 mt-5 text-sm"><a className="flex gap-2 hover:text-primary" href={`mailto:${profile.email}`}><Mail className="w-4 h-4"/>{profile.email}</a>{basic.phone&&<a className="flex gap-2 hover:text-primary" href={`tel:${basic.phone}`}><Phone className="w-4 h-4"/>{basic.phone}</a>}</div></header>
  <div className="grid lg:grid-cols-2 gap-8">
   <Section title="Personal information"><div className="grid sm:grid-cols-2 gap-3"><Value label="Age range" value={basic.ageRange}/><Value label="Preferred contact" value={basic.preferredContact}/><Value label="Family situation" value={basic.familySituation}/><Value label="Transportation" value={basic.transportation}/></div><div className="mt-3"><ObjectValues value={basic.languages}/></div></Section>
   <Section title="Church connection"><div className="grid sm:grid-cols-2 gap-3"><Value label="Attending" value={connection.attendanceLength}/><Value label="Following Jesus" value={connection.followingJesusLength}/><Value label="Connection level (self-reported)" value={connection.connectionLevel}/><Value label="Served here before" value={connection.servedBefore ? "Yes" : "No"}/><Value label="Prior service" value={connection.previousService}/></div><div className="mt-3"><ObjectValues value={connection.details}/></div></Section>
   <Section title="Passions"><div className="flex flex-wrap gap-2">{profile.passions.length ? profile.passions.map(x=><Badge key={x}>{x}</Badge>) : <span className="italic text-muted-foreground">No passions shared.</span>}</div></Section>
   <Section title="Ministry interests"><div className="flex flex-wrap gap-2">{profile.interests.length ? profile.interests.map(x=><Badge key={x} variant="outline">{x}</Badge>) : <span className="italic text-muted-foreground">No interests shared.</span>}</div></Section>
   <Section title="Availability & serving capacity"><div className="grid sm:grid-cols-2 gap-3"><Value label="Frequency" value={profile.servingFrequency}/><Value label="Times" value={profile.availability.join(", ")}/></div><div className="mt-3"><ObjectValues value={profile.availabilityDetails}/></div></Section>
    <Section title="Spiritual Gifts Assessment"><p className="text-sm text-muted-foreground mb-3">Member self-reflection, not a diagnosis or placement recommendation.</p><ObjectValues value={profile.assessmentSections.spiritualGifts}/></Section>
    <Section title="APEST Assessment"><p className="text-sm text-muted-foreground mb-3">Member self-reflection, not a diagnosis, score, or placement recommendation.</p><ObjectValues value={profile.assessmentSections.apest}/></Section>
    <Section title="Personality / Working Style Assessment"><p className="text-sm text-muted-foreground mb-3">Conversation-oriented self-reflection, not a personality diagnosis.</p><ObjectValues value={profile.assessmentSections.personalityStrengths}/></Section>
    <Section title="Natural Strength Assessment"><p className="text-sm text-muted-foreground mb-3">Member self-reflection; strengths are not ranked, scored, or used for automatic placement.</p><ObjectValues value={profile.assessmentSections.naturalStrengths}/></Section>
   <Section title="Skills & experience"><div className="grid sm:grid-cols-2 gap-3"><Value label="Occupation" value={skills.occupation}/><Value label="Unique skill" value={skills.uniqueSkills}/><Value label="Previous ministry experience" value={skills.previousMinistryExperience}/><Value label="Leadership experience" value={skills.leadershipExperience}/><Value label="Mission trip experience" value={skills.missionTripExperience}/></div><div className="mt-3"><ObjectValues value={skills.details}/></div></Section>
   <Section title="Life experiences"><p className="text-sm text-muted-foreground mb-3">Shared voluntarily; please handle with care and discretion.</p><ObjectValues value={profile.lifeExperiences}/></Section>
   <Section title="Spiritual health"><p className="text-sm text-muted-foreground mb-3">Pastoral self-reflection only, never a pass/fail measure.</p><ObjectValues value={profile.assessmentSections.spiritualHealth}/></Section>
   <Section title="Ministry preferences & environment"><ObjectValues value={profile.ministryPreferences}/></Section>
  </div>
 </div>;
}