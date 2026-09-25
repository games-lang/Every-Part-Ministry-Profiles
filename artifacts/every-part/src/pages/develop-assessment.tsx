import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import * as z from "zod";
import {
  type DevelopProfileInput,
  useGetPublicChurch,
  useSubmitDevelopProfile,
} from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, Check, Compass, Heart, Lightbulb, Loader2, Save, ShieldCheck, Sparkles, Trash2, Users, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileSubmissionError } from "@/lib/profile-submission-error";
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader";

const text = (max: number) => z.string().trim().min(1).max(max);
const list = (max = 8, maxLength = 80) => z.array(z.string().min(1)).min(1).max(max);
const optional = (max: number) => z.string().max(max).optional();

const formSchema = z.object({
  child: z.object({ firstName: text(80), lastName: text(80) }),
  answers: z.object({
    prayerAndCalling: z.object({ reflection: text(500) }),
    aboutMe: z.object({ likes: list(), goodAt: text(500), wantToLearn: text(500) }),
    howITendToOperate: z.object({
      peopleEnergy: z.enum(["energized-with-people", "mix-of-both", "recharge-alone"]),
      processingStyle: z.enum(["talk-it-out", "think-it-through", "learn-by-doing"]),
      planningStyle: z.enum(["plan-ahead", "adapt-as-you-go", "last-minute-energy"]),
      peopleLogic: z.enum(["people-first", "balance-both", "details-and-ideas"]),
      actionReflection: z.enum(["act-then-reflect", "reflect-then-act", "move-between-both"]),
      leadershipSupport: z.enum(["take-the-lead", "support-the-lead", "share-leadership"]),
      conflictStyle: z.enum(["address-it-directly", "listen-and-find-common-ground", "pause-and-seek-guidance"]),
      teamPreference: z.enum(["close-team", "variety-of-people", "independent-with-check-ins"]),
    }),
    giftsToExplore: z.object({ interests: list(), reflection: optional(400) }),
    passions: z.object({ peopleAndCauses: list(), reflection: text(500) }),
    growingWithJesus: z.object({ interests: list(), helperName: optional(120), wantsHelpWith: optional(500) }),
    callingAndPurpose: z.object({ whatMatters: text(500), futureHope: text(500), callingReflection: optional(500) }),
    ministryInterests: z.record(z.string(), z.enum(["love", "maybe", "not-now"]).optional()),
    availabilityAndResponsibility: z.object({
      availability: z.enum(["weekly", "monthly", "seasonal", "not-sure-yet"]),
      responsibilityStyle: z.enum(["ready-for-responsibility", "growing-into-it", "start-small"]),
      notes: optional(500),
    }),
    developmentPlan: z.object({ nextSteps: list(5, 160), supportNeeded: optional(500), goal: text(500) }),
  }),
  guardianObservations: z.object({
    strengths: optional(500),
    comesAlive: optional(500),
    comfortableOpportunities: optional(500),
    thriveNotes: optional(1000),
  }).optional(),
  guardian: z.object({
    name: text(120),
    email: z.string().trim().email("Please enter a valid email").max(254),
    consent: z.literal(true, { message: "Guardian consent is required" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;
type Choice = { id: string; label: string };

const LIKES: Choice[] = [
  { id: "people", label: "Spending time with people" }, { id: "creating", label: "Creating art, music, or media" },
  { id: "building", label: "Building or fixing things" }, { id: "learning", label: "Learning and asking questions" },
  { id: "organizing", label: "Organizing and planning" }, { id: "moving", label: "Being active and outdoors" },
  { id: "writing", label: "Writing or telling stories" }, { id: "helping", label: "Helping people solve problems" },
  { id: "technology", label: "Technology and design" }, { id: "quiet", label: "Reading or quiet projects" },
];
const GIFT_INTERESTS: Choice[] = [
  { id: "encouragement", label: "Encouraging people" }, { id: "teaching", label: "Teaching and explaining" },
  { id: "mercy", label: "Caring for people who are hurting" }, { id: "leadership", label: "Leading and taking initiative" },
  { id: "hospitality", label: "Making people feel welcome" }, { id: "service", label: "Practical service" },
  { id: "faith", label: "Trusting God in hard situations" }, { id: "wisdom", label: "Seeing wise next steps" },
  { id: "creativity", label: "Creative expression" }, { id: "prayer", label: "Focused prayer" },
  { id: "discernment", label: "Noticing what is helpful and true" }, { id: "evangelism", label: "Sharing why Jesus matters to me" },
];
const PEOPLE_CAUSES: Choice[] = [
  { id: "friends", label: "Friends and classmates" }, { id: "newcomers", label: "People who feel new or left out" },
  { id: "children", label: "Children and families" }, { id: "older-adults", label: "Older adults" },
  { id: "hurting", label: "People who are hurting" }, { id: "community", label: "My neighborhood" },
  { id: "justice", label: "Justice and fairness" }, { id: "missions", label: "People and cultures around the world" },
  { id: "creation", label: "Animals and creation" }, { id: "practical-needs", label: "Practical needs and service" },
];
const JESUS_INTERESTS: Choice[] = [
  { id: "prayer", label: "Prayer" }, { id: "bible", label: "Reading the Bible" },
  { id: "worship", label: "Worship" }, { id: "questions", label: "Asking honest questions" },
  { id: "serving", label: "Serving others" }, { id: "sharing", label: "Talking about Jesus" },
  { id: "mentoring", label: "Learning from a trusted Christian" }, { id: "community", label: "Growing with other students" },
];
const OPPORTUNITIES: Choice[] = [
  { id: "welcome", label: "Welcoming people" }, { id: "prayer", label: "Prayer" },
  { id: "kids", label: "Helping younger children" }, { id: "students", label: "Student ministry" },
  { id: "worship", label: "Worship or music" }, { id: "production", label: "Tech or production" },
  { id: "scriptureReading", label: "Reading Scripture" }, { id: "communityCare", label: "Community care" },
  { id: "missions", label: "Missions and outreach" }, { id: "creative", label: "Creative projects" },
  { id: "events", label: "Church events" }, { id: "behindTheScenes", label: "Behind-the-scenes support" },
];
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

const OPERATION_QUESTIONS: Array<{ name: string; label: string; options: Choice[] }> = [
  { name: "peopleEnergy", label: "Where do you tend to get your energy?", options: [
    { id: "energized-with-people", label: "Being around people energizes me" }, { id: "mix-of-both", label: "I enjoy a mix of people time and quiet time" }, { id: "recharge-alone", label: "I recharge with quiet time on my own" },
  ] },
  { name: "processingStyle", label: "How do you usually work through an idea?", options: [
    { id: "talk-it-out", label: "I like to talk it out" }, { id: "think-it-through", label: "I like to think it through first" }, { id: "learn-by-doing", label: "I learn by trying it" },
  ] },
  { name: "planningStyle", label: "What kind of plan helps you?", options: [
    { id: "plan-ahead", label: "A clear plan ahead of time" }, { id: "adapt-as-you-go", label: "A plan with room to adapt" }, { id: "last-minute-energy", label: "Freedom to respond as things develop" },
  ] },
  { name: "peopleLogic", label: "What do you notice first in a situation?", options: [
    { id: "people-first", label: "People and relationships" }, { id: "balance-both", label: "A balance of people, details, and ideas" }, { id: "details-and-ideas", label: "Details, patterns, and ideas" },
  ] },
  { name: "actionReflection", label: "How do you approach a new opportunity?", options: [
    { id: "act-then-reflect", label: "Try it, then think about what I learned" }, { id: "reflect-then-act", label: "Think and pray, then take a step" }, { id: "move-between-both", label: "Move between action and reflection" },
  ] },
  { name: "leadershipSupport", label: "Which role sounds most natural right now?", options: [
    { id: "take-the-lead", label: "Taking initiative and leading" }, { id: "support-the-lead", label: "Supporting and strengthening a leader" }, { id: "share-leadership", label: "Sharing leadership with others" },
  ] },
  { name: "conflictStyle", label: "When people disagree, what helps you most?", options: [
    { id: "address-it-directly", label: "Addressing the issue honestly" }, { id: "listen-and-find-common-ground", label: "Listening and looking for common ground" }, { id: "pause-and-seek-guidance", label: "Pausing and seeking guidance" },
  ] },
  { name: "teamPreference", label: "What team setting sounds best?", options: [
    { id: "close-team", label: "A close team that knows each other well" }, { id: "variety-of-people", label: "Working with a variety of people" }, { id: "independent-with-check-ins", label: "Independent work with regular check-ins" },
  ] },
];

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;
}

function PageIntro({ icon: Icon, title, description, color = "primary" }: { icon: typeof Compass; title: string; description: string; color?: string }) {
  return (
    <div className="mb-8 text-center">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-${color}/10`}>
        <Icon className={`h-8 w-8 text-${color}`} />
      </div>
      <h1 className="font-serif text-3xl font-medium tracking-tight">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function MultiSelect({ value, onChange, options, limit = 8 }: { value: string[]; onChange: (value: string[]) => void; options: Choice[]; limit?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.id);
        const disabled = !selected && value.length >= limit;
        return (
          <button key={option.id} type="button" aria-pressed={selected} disabled={disabled} onClick={() => onChange(selected ? value.filter((item) => item !== option.id) : [...value, option.id])}
            className={`rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : disabled ? "cursor-not-allowed border-border/50 bg-muted/50 text-muted-foreground/50" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SingleSelect({ value, onChange, options }: { value?: string; onChange: (value: string) => void; options: Choice[] }) {
  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const selected = value === option.id;
        return <button key={option.id} type="button" aria-pressed={selected} onClick={() => onChange(option.id)}
          className={`rounded-xl border-2 p-4 text-left transition-all ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"}`}>
          <div className="flex items-center gap-3"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-primary" : "border-muted-foreground/30"}`}>{selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}</span><span className={`font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{option.label}</span></div>
        </button>;
      })}
    </div>
  );
}

export default function DevelopAssessment({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [, setLocation] = useLocation();
  const search = new URLSearchParams(window.location.search);
  const age = Number(search.get("age"));
  const birthdate = search.get("birthdate") || undefined;
  const { data: church, isLoading } = useGetPublicChurch(slug);
  const submitProfile = useSubmitDevelopProfile();
  const [section, setSection] = useState(1);
  const [saveDraft, setSaveDraft] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState("");
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalSections = 10;

  const form = useForm<FormValues>({
    defaultValues: {
      child: { firstName: "", lastName: "" },
      answers: {
        prayerAndCalling: { reflection: "" },
        aboutMe: { likes: [], goodAt: "", wantToLearn: "" },
        howITendToOperate: Object.fromEntries(OPERATION_QUESTIONS.map(({ name }) => [name, undefined])) as unknown as FormValues["answers"]["howITendToOperate"],
        giftsToExplore: { interests: [], reflection: "" },
        passions: { peopleAndCauses: [], reflection: "" },
        growingWithJesus: { interests: [], helperName: "", wantsHelpWith: "" },
        callingAndPurpose: { whatMatters: "", futureHope: "", callingReflection: "" },
        ministryInterests: {},
        availabilityAndResponsibility: { availability: undefined as never, responsibilityStyle: undefined as never, notes: "" },
        developmentPlan: { nextSteps: [], supportNeeded: "", goal: "" },
      },
      guardianObservations: { strengths: "", comesAlive: "", comfortableOpportunities: "", thriveNotes: "" },
      guardian: { name: "", email: "", consent: undefined as never },
    },
    mode: "onChange",
  });
  const { control, register, watch, formState: { errors } } = form;
  const values = watch();

  useEffect(() => {
    const raw = localStorage.getItem(`every-part-develop-draft-${slug}`);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (Date.now() - draft.timestamp < DRAFT_EXPIRY_MS) {
        form.reset(draft.data);
        setSaveDraft(true);
      } else localStorage.removeItem(`every-part-develop-draft-${slug}`);
    } catch {
      localStorage.removeItem(`every-part-develop-draft-${slug}`);
    }
  }, [form, slug]);

  useEffect(() => {
    if (!saveDraft) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const data = JSON.parse(JSON.stringify(values));
      delete data.guardian.consent;
      localStorage.setItem(`every-part-develop-draft-${slug}`, JSON.stringify({ timestamp: Date.now(), data }));
      setSavedFeedback("Draft saved");
      window.setTimeout(() => setSavedFeedback(""), 2000);
    }, 800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [saveDraft, slug, values]);

  const clear = (path: string) => form.clearErrors(path as never);
  const required = (path: string, value: unknown, message = "Please complete this field.") => {
    if (typeof value === "string" ? !value.trim() : !value || (Array.isArray(value) && value.length === 0)) {
      form.setError(path as never, { type: "manual", message });
      return false;
    }
    clear(path);
    return true;
  };
  const validateSection = (current: number) => {
    const v = form.getValues();
    let valid = true;
    const check = (path: string, value: unknown, message?: string) => { const ok = required(path, value, message); valid = ok && valid; };
    if (current === 1) { check("child.firstName", v.child.firstName, "First name is required"); check("child.lastName", v.child.lastName, "Last name is required"); check("answers.prayerAndCalling.reflection", v.answers.prayerAndCalling.reflection); }
    if (current === 2) { check("answers.aboutMe.likes", v.answers.aboutMe.likes, "Choose at least one"); check("answers.aboutMe.goodAt", v.answers.aboutMe.goodAt); check("answers.aboutMe.wantToLearn", v.answers.aboutMe.wantToLearn); }
    if (current === 3) OPERATION_QUESTIONS.forEach(({ name }) => check(`answers.howITendToOperate.${name}`, v.answers.howITendToOperate[name as keyof typeof v.answers.howITendToOperate]));
    if (current === 4) check("answers.giftsToExplore.interests", v.answers.giftsToExplore.interests, "Choose at least one area to explore");
    if (current === 5) { check("answers.passions.peopleAndCauses", v.answers.passions.peopleAndCauses, "Choose at least one"); check("answers.passions.reflection", v.answers.passions.reflection); }
    if (current === 6) check("answers.growingWithJesus.interests", v.answers.growingWithJesus.interests, "Choose at least one");
    if (current === 7) { check("answers.callingAndPurpose.whatMatters", v.answers.callingAndPurpose.whatMatters); check("answers.callingAndPurpose.futureHope", v.answers.callingAndPurpose.futureHope); }
    if (current === 8) { const count = Object.values(v.answers.ministryInterests).filter((item) => item === "love" || item === "maybe").length; if (count < 2) { form.setError("answers.ministryInterests", { type: "manual", message: "Choose at least two interests you would love or might like to explore." }); valid = false; } else clear("answers.ministryInterests"); }
    if (current === 9) { check("answers.availabilityAndResponsibility.availability", v.answers.availabilityAndResponsibility.availability); check("answers.availabilityAndResponsibility.responsibilityStyle", v.answers.availabilityAndResponsibility.responsibilityStyle); }
    if (current === 10) { check("answers.developmentPlan.nextSteps", v.answers.developmentPlan.nextSteps, "Choose at least one next step"); check("answers.developmentPlan.goal", v.answers.developmentPlan.goal); check("guardian.name", v.guardian.name, "Guardian name is required"); check("guardian.email", v.guardian.email, "Guardian email is required"); if (v.guardian.consent !== true) { form.setError("guardian.consent", { type: "manual", message: "Guardian consent is required" }); valid = false; } else clear("guardian.consent"); }
    return valid;
  };
  const next = () => { if (validateSection(section)) { setSection((current) => Math.min(totalSections, current + 1)); window.scrollTo(0, 0); } };
  const back = () => { setSection((current) => Math.max(1, current - 1)); window.scrollTo(0, 0); };
  const discard = () => {
    localStorage.removeItem(`every-part-develop-draft-${slug}`);
    setSaveDraft(false);
    form.reset();
    setSection(1);
    setSavedFeedback("Draft discarded.");
    window.setTimeout(() => setSavedFeedback(""), 2500);
  };

  const onSubmit = (submitted: FormValues) => {
    if (photoUploading) return;
    let firstInvalid = 0;
    for (let index = 1; index <= totalSections; index += 1) if (!validateSection(index) && !firstInvalid) firstInvalid = index;
    const parsed = formSchema.safeParse(submitted);
    if (firstInvalid || !parsed.success || !Number.isInteger(age) || age < 13 || age > 17) {
      if (firstInvalid) setSection(firstInvalid);
      if (!Number.isInteger(age) || age < 13 || age > 17) form.setError("root", { type: "manual", message: "This pathway is for ages 13–17. Please return to the age check." });
      else if (!firstInvalid && !parsed.success) form.setError("root", { type: "manual", message: "Please check the form for missing information." });
      return;
    }
    const cleanOptional = (value?: string) => value?.trim() ? value.trim() : undefined;
    const observationValues = submitted.guardianObservations || {};
    const observations = Object.fromEntries(Object.entries(observationValues || {}).map(([key, value]) => [key, cleanOptional(value)]).filter(([, value]) => value)) as DevelopProfileInput["guardianObservations"];
    const answers = submitted.answers;
    const payload: DevelopProfileInput = {
      churchSlug: slug, age, journeyToken: localStorage.getItem("every-part-journey-token") || undefined, ...(birthdate ? { birthdate } : {}), profileType: "develop", ...(profilePhotoPath ? { profilePhotoPath } : {}),
      child: { firstName: submitted.child.firstName.trim(), lastName: submitted.child.lastName.trim() },
      guardian: { name: submitted.guardian.name.trim(), email: submitted.guardian.email.trim(), consent: true },
      answers: {
        ...answers,
        prayerAndCalling: { reflection: answers.prayerAndCalling.reflection.trim() },
        aboutMe: { likes: answers.aboutMe.likes, goodAt: answers.aboutMe.goodAt.trim(), wantToLearn: answers.aboutMe.wantToLearn.trim() },
        giftsToExplore: { interests: answers.giftsToExplore.interests, ...(cleanOptional(answers.giftsToExplore.reflection) ? { reflection: cleanOptional(answers.giftsToExplore.reflection) } : {}) },
        passions: { peopleAndCauses: answers.passions.peopleAndCauses, reflection: answers.passions.reflection.trim() },
        growingWithJesus: { interests: answers.growingWithJesus.interests, ...(cleanOptional(answers.growingWithJesus.helperName) ? { helperName: cleanOptional(answers.growingWithJesus.helperName) } : {}), ...(cleanOptional(answers.growingWithJesus.wantsHelpWith) ? { wantsHelpWith: cleanOptional(answers.growingWithJesus.wantsHelpWith) } : {}) },
        callingAndPurpose: { whatMatters: answers.callingAndPurpose.whatMatters.trim(), futureHope: answers.callingAndPurpose.futureHope.trim(), ...(cleanOptional(answers.callingAndPurpose.callingReflection) ? { callingReflection: cleanOptional(answers.callingAndPurpose.callingReflection) } : {}) },
        ministryInterests: Object.fromEntries(Object.entries(answers.ministryInterests).filter(([, value]) => value)),
        availabilityAndResponsibility: { availability: answers.availabilityAndResponsibility.availability, responsibilityStyle: answers.availabilityAndResponsibility.responsibilityStyle, ...(cleanOptional(answers.availabilityAndResponsibility.notes) ? { notes: cleanOptional(answers.availabilityAndResponsibility.notes) } : {}) },
        developmentPlan: { nextSteps: answers.developmentPlan.nextSteps, goal: answers.developmentPlan.goal.trim(), ...(cleanOptional(answers.developmentPlan.supportNeeded) ? { supportNeeded: cleanOptional(answers.developmentPlan.supportNeeded) } : {}) },
      },
      ...(Object.keys(observations || {}).length ? { guardianObservations: observations } : {}),
    };
    submitProfile.mutate({ data: payload }, {
      onSuccess: (result) => {
        localStorage.setItem("every-part-journey-token", result.journeyToken);
        localStorage.removeItem(`every-part-develop-draft-${slug}`);
        setLocation(`/develop/result/${result.resultToken}`);
      },
      onError: (error) => alert(profileSubmissionError(error)),
    });
  };

  if (!Number.isInteger(age) || age < 13 || age > 17) return <AgeError slug={slug} />;
  if (isLoading) return <div className="pathway-theme pathway-theme-develop flex min-h-[100dvh] items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!church) return <AgeError slug={slug} message="We couldn't find this church. Please check your link and try again." />;

  const youthProfile = church.assessmentConfiguration.youthProfiles?.develop;
  const titleFor = (key: string, fallback: string) => youthProfile?.sections?.[key]?.title || fallback;
  const descriptionFor = (key: string, fallback: string) => youthProfile?.sections?.[key]?.description || fallback;
  const optionsFor = (key: string, options: Choice[]) =>
    options.map((option) => ({ ...option, label: youthProfile?.choiceLabels?.[`${key}.${option.id}`] || option.label }));
  const errorFor = (path: string) => path.split(".").reduce<any>((value, key) => value?.[key], errors)?.message as string | undefined;
  const selectedOperation = (name: string) => values.answers.howITendToOperate[name as keyof typeof values.answers.howITendToOperate] as string | undefined;
  const opportunityButtons = (name: "answers.ministryInterests") => (
    <div className="grid gap-3">
      {optionsFor("ministryInterests", OPPORTUNITIES).map((option) => <Controller key={option.id} name={`${name}.${option.id}` as never} control={control} render={({ field }) => (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">{option.label}</span>
          <div className="flex flex-wrap gap-2">
            {([["love", "I’d love to"], ["maybe", "Maybe"], ["not-now", "Not right now"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={field.value === value} onClick={() => field.onChange(value)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${field.value === value ? value === "love" ? "border-primary bg-primary text-primary-foreground" : value === "maybe" ? "border-secondary bg-secondary/10 text-secondary" : "border-muted-foreground/30 bg-muted text-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{label}</button>)}
          </div>
        </div>
      )} />
      )}
    </div>
  );

  return (
    <div className="pathway-theme pathway-theme-develop min-h-[100dvh] bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">{church.logoUrl ? <img src={church.logoUrl} alt="Church logo" className="h-8 object-contain" /> : <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Compass className="h-4 w-4 text-primary" /></div>}<span className="hidden font-serif font-medium sm:inline">Develop Profile</span></div>
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">Step {section} of {totalSections}<div className="h-2 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${section / totalSections * 100}%` }} /></div></div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-8 sm:pt-12">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {section === 1 && <div className="space-y-6"><PageIntro icon={Sparkles} title={youthProfile?.profileTitle || titleFor("prayerAndCalling", "Prayer & Calling")} description={youthProfile?.profileDescription || descriptionFor("prayerAndCalling", "Start by noticing what God may be inviting you to pay attention to. There is no pressure to have everything figured out.")} color="secondary" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" {...register("child.firstName")} className={errorFor("child.firstName") ? "border-destructive" : ""} /><FieldError message={errorFor("child.firstName")} /></div><div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" {...register("child.lastName")} className={errorFor("child.lastName") ? "border-destructive" : ""} /><FieldError message={errorFor("child.lastName")} /></div></div><ProfilePhotoUploader churchSlug={slug} name={`${values.child.firstName} ${values.child.lastName}`} value={profilePhotoPath} onChange={setProfilePhotoPath} onUploadingChange={setPhotoUploading} /><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="prayerReflection" className="text-lg">What are you praying about, wondering about, or sensing right now?</Label><Textarea id="prayerReflection" placeholder="I’m praying about..." className="min-h-[140px]" {...register("answers.prayerAndCalling.reflection")} /><FieldError message={errorFor("answers.prayerAndCalling.reflection")} /></div></CardContent></Card></div>}
          {section === 2 && <div className="space-y-6"><PageIntro icon={Heart} title="About Me" description="Your everyday interests and strengths can be clues worth paying attention to." color="primary" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="space-y-3"><Label className="text-lg">What do you enjoy?</Label><p className="text-sm text-muted-foreground">Choose up to 8.</p><Controller name="answers.aboutMe.likes" control={control} render={({ field }) => <MultiSelect value={field.value} onChange={field.onChange} options={LIKES} />} /><FieldError message={errorFor("answers.aboutMe.likes")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="goodAt" className="text-lg">What are you naturally good at?</Label><Textarea id="goodAt" placeholder="People often notice that I..." className="min-h-[110px]" {...register("answers.aboutMe.goodAt")} /><FieldError message={errorFor("answers.aboutMe.goodAt")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="wantToLearn" className="text-lg">What would you like to grow or learn?</Label><Textarea id="wantToLearn" placeholder="I’d like to learn..." className="min-h-[110px]" {...register("answers.aboutMe.wantToLearn")} /><FieldError message={errorFor("answers.aboutMe.wantToLearn")} /></div></CardContent></Card></div>}
          {section === 3 && <div className="space-y-6"><PageIntro icon={Compass} title="How I Tend to Operate" description="These are flexible reflections, not a personality type. Choose what sounds most like you lately." color="secondary" /><div className="grid gap-5">{OPERATION_QUESTIONS.map(({ name, label, options }) => <Card key={name} className={errorFor(`answers.howITendToOperate.${name}`) ? "border-destructive" : ""}><CardContent className="space-y-4 p-5 sm:p-7"><Label className="text-lg">{label}</Label><Controller name={`answers.howITendToOperate.${name}` as never} control={control} render={({ field }) => <SingleSelect value={selectedOperation(name)} onChange={field.onChange} options={options} />} /><FieldError message={errorFor(`answers.howITendToOperate.${name}`)} /></CardContent></Card>)}</div></div>}
          {section === 4 && <div className="space-y-6"><PageIntro icon={WandSparkles} title="Gifts You May Want to Explore Further" description="These are areas you might enjoy exploring with trusted people. They are possibilities, not conclusions about you." color="chart-3" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="space-y-3"><Label className="text-lg">Which areas sound interesting to explore?</Label><p className="text-sm text-muted-foreground">Choose up to 8.</p><Controller name="answers.giftsToExplore.interests" control={control} render={({ field }) => <MultiSelect value={field.value} onChange={field.onChange} options={GIFT_INTERESTS} />} /><FieldError message={errorFor("answers.giftsToExplore.interests")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="giftReflection">What makes these areas interesting to you? (Optional)</Label><Textarea id="giftReflection" className="min-h-[110px]" {...register("answers.giftsToExplore.reflection")} /></div></CardContent></Card></div>}
          {section === 5 && <div className="space-y-6"><PageIntro icon={Heart} title="Passions" description="Think about the people, needs, and causes that matter to you—not just inside a church building." color="chart-1" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="space-y-3"><Label className="text-lg">Who or what do you care about?</Label><p className="text-sm text-muted-foreground">Choose up to 8.</p><Controller name="answers.passions.peopleAndCauses" control={control} render={({ field }) => <MultiSelect value={field.value} onChange={field.onChange} options={PEOPLE_CAUSES} />} /><FieldError message={errorFor("answers.passions.peopleAndCauses")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="passionReflection" className="text-lg">Why does this matter to you?</Label><Textarea id="passionReflection" placeholder="This matters to me because..." className="min-h-[130px]" {...register("answers.passions.reflection")} /><FieldError message={errorFor("answers.passions.reflection")} /></div></CardContent></Card></div>}
          {section === 6 && <div className="space-y-6"><PageIntro icon={Sparkles} title="Growing With Jesus" description="Faith grows through honest questions, community, prayer, and practice. Share what would help you take your next step." color="chart-3" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="space-y-3"><Label className="text-lg">What are you interested in right now?</Label><Controller name="answers.growingWithJesus.interests" control={control} render={({ field }) => <MultiSelect value={field.value} onChange={field.onChange} options={JESUS_INTERESTS} />} /><FieldError message={errorFor("answers.growingWithJesus.interests")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="helperName">Who helps you follow Jesus? (Optional)</Label><Input id="helperName" placeholder="A trusted person..." {...register("answers.growingWithJesus.helperName")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="wantsHelpWith">What would you like help with or want to ask about? (Optional)</Label><Textarea id="wantsHelpWith" className="min-h-[110px]" {...register("answers.growingWithJesus.wantsHelpWith")} /></div></CardContent></Card></div>}
          {section === 7 && <div className="space-y-6"><PageIntro icon={Lightbulb} title="Calling & Purpose" description="Calling can be lived out in any vocation. For now, focus on what matters to you and the kind of difference you hope to make." color="chart-4" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="space-y-2"><Label htmlFor="whatMatters" className="text-lg">What matters deeply to you?</Label><Textarea id="whatMatters" placeholder="I care deeply about..." className="min-h-[130px]" {...register("answers.callingAndPurpose.whatMatters")} /><FieldError message={errorFor("answers.callingAndPurpose.whatMatters")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="futureHope" className="text-lg">What kind of difference do you hope to make?</Label><Textarea id="futureHope" placeholder="I hope to..." className="min-h-[130px]" {...register("answers.callingAndPurpose.futureHope")} /><FieldError message={errorFor("answers.callingAndPurpose.futureHope")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="callingReflection">Anything else you want to say about your direction? (Optional)</Label><Textarea id="callingReflection" className="min-h-[100px]" {...register("answers.callingAndPurpose.callingReflection")} /></div></CardContent></Card></div>}
          {section === 8 && <div className="space-y-6"><PageIntro icon={Users} title="Ministry Interests" description="Imagine trying a few things with support. Choose at least two that you would love or might like to explore." color="primary" />{opportunityButtons("answers.ministryInterests")}<FieldError message={errorFor("answers.ministryInterests")} /></div>}
          {section === 9 && <div className="space-y-6"><PageIntro icon={Compass} title="Availability & Responsibility" description="There is no wrong answer. This helps leaders offer a realistic next step that respects your current season." color="secondary" /><Card><CardContent className="space-y-7 p-6 sm:p-8"><div className="space-y-3"><Label className="text-lg">How often might you be available?</Label><Controller name="answers.availabilityAndResponsibility.availability" control={control} render={({ field }) => <SingleSelect value={field.value} onChange={field.onChange} options={[{ id: "weekly", label: "Most weeks" }, { id: "monthly", label: "A few times a month" }, { id: "seasonal", label: "For special projects or seasons" }, { id: "not-sure-yet", label: "I’m not sure yet" }]} />} /><FieldError message={errorFor("answers.availabilityAndResponsibility.availability")} /></div><div className="space-y-3 border-t border-border/40 pt-6"><Label className="text-lg">What kind of responsibility fits right now?</Label><Controller name="answers.availabilityAndResponsibility.responsibilityStyle" control={control} render={({ field }) => <SingleSelect value={field.value} onChange={field.onChange} options={[{ id: "ready-for-responsibility", label: "I’m ready to take responsibility for a task" }, { id: "growing-into-it", label: "I’m growing into more responsibility" }, { id: "start-small", label: "I’d like to start small with support" }]} />} /><FieldError message={errorFor("answers.availabilityAndResponsibility.responsibilityStyle")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="availabilityNotes">Anything leaders should know about your schedule or support needs? (Optional)</Label><Textarea id="availabilityNotes" className="min-h-[100px]" {...register("answers.availabilityAndResponsibility.notes")} /></div></CardContent></Card></div>}
          {section === 10 && <div className="space-y-6"><PageIntro icon={ShieldCheck} title="My Development Plan" description="Choose a small next step and tell us how a trusted leader can support you. A guardian will review this before it is shared." color="primary" /><Card><CardContent className="space-y-6 p-6 sm:p-8"><div className="space-y-3"><Label className="text-lg">What would you like to try next?</Label><p className="text-sm text-muted-foreground">Choose up to 5.</p><Controller name="answers.developmentPlan.nextSteps" control={control} render={({ field }) => <MultiSelect limit={5} value={field.value} onChange={field.onChange} options={[{ id: "conversation", label: "Talk with a ministry leader" }, { id: "shadow", label: "Shadow someone serving" }, { id: "try", label: "Try one ministry opportunity" }, { id: "training", label: "Join a training or class" }, { id: "practice", label: "Practice a skill with support" }, { id: "pray", label: "Pray and keep noticing" }, { id: "serve-school", label: "Serve people at school or work" }]} />} /><FieldError message={errorFor("answers.developmentPlan.nextSteps")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="goal" className="text-lg">What is one goal you would like to work toward?</Label><Textarea id="goal" placeholder="Over the next season, I’d like to..." className="min-h-[120px]" {...register("answers.developmentPlan.goal")} /><FieldError message={errorFor("answers.developmentPlan.goal")} /></div><div className="space-y-2 border-t border-border/40 pt-6"><Label htmlFor="supportNeeded">What support would help? (Optional)</Label><Textarea id="supportNeeded" className="min-h-[100px]" {...register("answers.developmentPlan.supportNeeded")} /></div></CardContent></Card><Card className="border-border/60 bg-muted/20"><CardContent className="space-y-5 p-6 sm:p-8"><div><h2 className="font-serif text-2xl font-medium">Guardian review</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Parents or guardians, please add your perspective. These notes stay separate from the teen’s answers.</p></div>{(["strengths", "comesAlive", "comfortableOpportunities", "thriveNotes"] as const).map((key) => <div key={key} className="space-y-2 border-t border-border/40 pt-4"><Label htmlFor={key}>{({ strengths: "What strengths do you notice?", comesAlive: "When do they seem to come alive?", comfortableOpportunities: "Where might they feel comfortable starting?", thriveNotes: "How do they learn or thrive best?" })[key]} (Optional)</Label><Textarea id={key} className="min-h-[80px]" {...register(`guardianObservations.${key}`)} /></div>)}</CardContent></Card><Card className="border-2 border-primary/20"><CardContent className="space-y-6 p-6 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="guardianName">Guardian name</Label><Input id="guardianName" {...register("guardian.name")} className={errorFor("guardian.name") ? "border-destructive" : ""} /><FieldError message={errorFor("guardian.name")} /></div><div className="space-y-2"><Label htmlFor="guardianEmail">Guardian email</Label><Input id="guardianEmail" type="email" {...register("guardian.email")} className={errorFor("guardian.email") ? "border-destructive" : ""} /><FieldError message={errorFor("guardian.email")} /></div></div><div className="flex items-start gap-3 border-t border-border/40 pt-5"><Controller name="guardian.consent" control={control} render={({ field }) => <Checkbox id="consent" checked={field.value === true} onCheckedChange={field.onChange} className={errorFor("guardian.consent") ? "border-destructive" : ""} />} /><div><label htmlFor="consent" className="cursor-pointer text-sm font-medium leading-relaxed">I consent to sharing this profile with approved church ministry leaders to support this teen’s growth, conversations, and serving journey.</label><FieldError message={errorFor("guardian.consent")} /></div></div>{form.formState.errors.root?.message && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">{form.formState.errors.root.message}</div>}{submitProfile.error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">We couldn’t submit this profile. Please check the answers and try again.</div>}<Button type="submit" size="lg" disabled={submitProfile.isPending} className="w-full text-base">{submitProfile.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}Submit Develop Profile</Button></CardContent></Card></div>}
          <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-6"><div className="flex items-center gap-3">{section > 1 ? <Button type="button" variant="outline" onClick={back}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button> : <Button type="button" variant="ghost" asChild><Link href={`/profile/${slug}`}>Cancel</Link></Button>}{saveDraft && <Button type="button" variant="ghost" size="sm" onClick={discard} className="text-muted-foreground hover:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Discard draft</Button>}{savedFeedback && <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><Save className="h-4 w-4" />{savedFeedback}</span>}</div>{section < totalSections ? <Button type="button" size="lg" onClick={next}>Continue<ArrowRight className="ml-2 h-4 w-4" /></Button> : <div />}</div>
          {section === 10 && <div className="flex items-center gap-3 text-sm text-muted-foreground"><Checkbox id="saveDraft" checked={saveDraft} onCheckedChange={(checked) => { setSaveDraft(checked === true); if (checked !== true) { localStorage.removeItem(`every-part-develop-draft-${slug}`); setSavedFeedback("Draft removed from this device."); } }} /><label htmlFor="saveDraft" className="cursor-pointer">Save my progress on this device for 24 hours. Do not use on a shared computer.</label></div>}
        </form>
      </main>
    </div>
  );
}

function AgeError({ slug, message = "This assessment is designed for ages 13–17. Please return to the age check." }: { slug: string; message?: string }) {
  return <div className="pathway-theme pathway-theme-develop flex min-h-[100dvh] items-center justify-center bg-background p-4"><Card className="w-full max-w-md text-center"><CardContent className="space-y-5 p-8"><Compass className="mx-auto h-12 w-12 text-primary" /><h1 className="font-serif text-2xl font-medium">Age check needed</h1><p className="leading-relaxed text-muted-foreground">{message}</p><Button asChild className="w-full"><Link href={`/profile/${slug}`}>Return to start</Link></Button></CardContent></Card></div>;
}