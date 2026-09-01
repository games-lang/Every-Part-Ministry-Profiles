import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useForm, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetPublicChurch,
  useSubmitDiscoverProfile,
  type DiscoverProfileInput
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Star,
  User,
  Users,
  Sprout,
  HandHeart,
  Lightbulb,
  Check,
  ShieldCheck,
  Save,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";

// --- Form Schema ---
const formSchema = z.object({
  child: z.object({
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
  }),
  answers: z.object({
    aboutMe: z.object({
      likes: z.array(z.string()).default([]),
      goodAt: z.string().max(300).default(""),
      wantToLearn: z.string().max(300).default(""),
    }),
    tendencies: z.object({
      peopleEnergy: z.enum(["love", "sometimes", "quiet"]),
      newThings: z.enum(["love", "sometimes", "not-yet"]),
      helpingResponse: z.enum(["jump-in", "ask-first", "prefer-support"]),
      enjoys: z.array(z.string()).default([]),
    }),
    caresAbout: z.array(z.string()).default([]),
    waysToHelp: z.array(z.string()).default([]),
    growingWithJesus: z.object({
      interests: z.array(z.string()).default([]),
      helperName: z.string().max(120).optional(),
      wantsHelpWith: z.string().max(300).optional(),
    }),
    opportunities: z.object({
      welcome: z.enum(["love", "maybe", "not-now"]).optional(),
      kids: z.enum(["love", "maybe", "not-now"]).optional(),
      students: z.enum(["love", "maybe", "not-now"]).optional(),
      worship: z.enum(["love", "maybe", "not-now"]).optional(),
      production: z.enum(["love", "maybe", "not-now"]).optional(),
      prayer: z.enum(["love", "maybe", "not-now"]).optional(),
      hospitality: z.enum(["love", "maybe", "not-now"]).optional(),
      communityCare: z.enum(["love", "maybe", "not-now"]).optional(),
      outreach: z.enum(["love", "maybe", "not-now"]).optional(),
      creative: z.enum(["love", "maybe", "not-now"]).optional(),
      behindTheScenes: z.enum(["love", "maybe", "not-now"]).optional(),
    }).default({}),
  }),
  guardianObservations: z.object({
    strengths: z.string().max(500).optional(),
    comesAlive: z.string().max(500).optional(),
    comfortableOpportunities: z.string().max(500).optional(),
    thriveNotes: z.string().max(1000).optional(),
  }).optional(),
  guardian: z.object({
    name: z.string().min(1, "Guardian name is required").max(120),
    email: z.string().email("Valid email is required").max(254),
    consent: z.literal(true, { message: "Consent is required" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

// --- Constants ---
const ENJOYS_OPTIONS = [
  { id: "building", label: "Building things" },
  { id: "creating", label: "Creating art or music" },
  { id: "moving", label: "Moving around and being active" },
  { id: "talking", label: "Talking and sharing stories" },
  { id: "listening", label: "Listening to others" },
  { id: "organizing", label: "Organizing and sorting" },
  { id: "learning", label: "Learning new facts" },
  { id: "caring", label: "Caring for living things" },
];

const CARES_ABOUT_OPTIONS = [
  { id: "family", label: "My family" },
  { id: "friends", label: "My friends" },
  { id: "youngerKids", label: "Younger children" },
  { id: "olderPeople", label: "Older people" },
  { id: "lonelyPeople", label: "People who feel lonely" },
  { id: "animals", label: "Animals" },
  { id: "nature", label: "Nature and the earth" },
  { id: "church", label: "My church family" },
  { id: "neighborhood", label: "My neighborhood" },
];

const LIKES_TO_HELP_OPTIONS = [
  { id: "welcoming", label: "Welcoming people" },
  { id: "encouraging", label: "Cheering people up" },
  { id: "making", label: "Making things for others" },
  { id: "organizing", label: "Putting things away" },
  { id: "praying", label: "Praying for people" },
  { id: "sharing", label: "Sharing what I have" },
  { id: "listening", label: "Listening to people" },
  { id: "cleaning", label: "Cleaning and tidying" },
  { id: "teaching", label: "Showing others how to do things" },
  { id: "performing", label: "Singing or performing" },
];

const INTERESTS_OPTIONS = [
  { id: "bibleStories", label: "Bible stories" },
  { id: "prayer", label: "How to pray" },
  { id: "worship", label: "Worship and music" },
  { id: "helpingOthers", label: "How to help others" },
  { id: "questionsAboutGod", label: "Big questions about God" },
  { id: "quietTime", label: "Having quiet time with Jesus" },
];

const OPPORTUNITIES = [
  { id: "welcome", label: "Handing out bulletins or welcoming people" },
  { id: "kids", label: "Helping with younger kids" },
  { id: "students", label: "Being part of a student team" },
  { id: "worship", label: "Singing or helping lead a song" },
  { id: "production", label: "Helping with lights or sound" },
  { id: "prayer", label: "Praying for people in our church" },
  { id: "hospitality", label: "Helping set up chairs or snacks" },
  { id: "communityCare", label: "Drawing cards for people who are sick" },
  { id: "outreach", label: "Helping our neighborhood" },
  { id: "creative", label: "Drawing, taking photos, or making art" },
  { id: "behindTheScenes", label: "Helping organize and clean up" },
];

const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function DiscoverAssessment({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const ageQuery = searchParams.get("age");
  const initialAge = ageQuery ? Number(ageQuery) : NaN;
  const initialBirthdate = searchParams.get("birthdate") || undefined;
  
  if (!initialAge || isNaN(initialAge)) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
        <Card className="w-full max-w-md border-border/60 shadow-lg text-center landing-reveal">
          <CardContent className="p-8">
            <h2 className="text-xl font-serif font-medium mb-3">Age Required</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We need to know your age to ensure we provide the right ministry profile.
            </p>
            <Button asChild variant="default" className="w-full">
              <Link href={`/profile/${slug}`}>
                Return to start
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: church, isLoading: churchLoading } = useGetPublicChurch(slug);
  const submitProfile = useSubmitDiscoverProfile();

  const [savedFeedback, setSavedFeedback] = useState("");
  const [saveDraftOptIn, setSaveDraftOptIn] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      child: { firstName: "", lastName: "" },
      answers: {
        aboutMe: { likes: [], goodAt: "", wantToLearn: "" },
        tendencies: {
          peopleEnergy: "love",
          newThings: "love",
          helpingResponse: "jump-in",
          enjoys: [],
        },
        caresAbout: [],
        waysToHelp: [],
        growingWithJesus: { interests: [], helperName: "", wantsHelpWith: "" },
        opportunities: {},
      },
      guardianObservations: {
        strengths: "",
        comesAlive: "",
        comfortableOpportunities: "",
        thriveNotes: "",
      },
      guardian: { name: "", email: "", consent: undefined as unknown as true },
    },
  });

  const { watch, handleSubmit, control, formState: { errors }, reset } = form;
  const watchedValues = watch();

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftString = localStorage.getItem(`every-part-discover-draft-${slug}`);
    if (draftString) {
      try {
        const { timestamp, data } = JSON.parse(draftString);
        if (Date.now() - timestamp < DRAFT_EXPIRY_MS) {
          reset(data);
          setSaveDraftOptIn(true);
          setSavedFeedback("Restored unexpired draft saved on this device.");
          setTimeout(() => setSavedFeedback(""), 4000);
        } else {
          localStorage.removeItem(`every-part-discover-draft-${slug}`);
        }
      } catch (e) {
        // ignore malformed draft
        localStorage.removeItem(`every-part-discover-draft-${slug}`);
      }
    }
  }, [slug, reset]);

  // Save to localStorage on change if opted in
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!saveDraftOptIn) return;

    saveTimeoutRef.current = setTimeout(() => {
      // Omit guardian consent from the persisted draft
      const draftData = { ...watchedValues };
      if (draftData.guardian) {
        draftData.guardian = { ...draftData.guardian, consent: undefined as unknown as true };
      }
      localStorage.setItem(`every-part-discover-draft-${slug}`, JSON.stringify({
        timestamp: Date.now(),
        data: draftData,
      }));
      setSavedFeedback("Draft saved on this device.");
      setTimeout(() => setSavedFeedback(""), 2000);
    }, 1500);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [watchedValues, slug, saveDraftOptIn]);

  const discardDraft = () => {
    localStorage.removeItem(`every-part-discover-draft-${slug}`);
    setSaveDraftOptIn(false);
    reset({
      child: { firstName: "", lastName: "" },
      answers: {
        aboutMe: { likes: [], goodAt: "", wantToLearn: "" },
        tendencies: {
          peopleEnergy: "love",
          newThings: "love",
          helpingResponse: "jump-in",
          enjoys: [],
        },
        caresAbout: [],
        waysToHelp: [],
        growingWithJesus: { interests: [], helperName: "", wantsHelpWith: "" },
        opportunities: {},
      },
      guardianObservations: {
        strengths: "",
        comesAlive: "",
        comfortableOpportunities: "",
        thriveNotes: "",
      },
      guardian: { name: "", email: "", consent: undefined as unknown as true },
    });
    setSavedFeedback("Draft discarded.");
    setTimeout(() => setSavedFeedback(""), 3000);
  };

  const onSubmit = (data: FormValues) => {
    if (!initialAge || isNaN(initialAge)) {
      alert("Missing age. Please go back and enter an age.");
      return;
    }

    let processedObservations: DiscoverProfileInput["guardianObservations"] = undefined;
    if (data.guardianObservations) {
      const obs = {
        strengths: data.guardianObservations.strengths?.trim(),
        comesAlive: data.guardianObservations.comesAlive?.trim(),
        comfortableOpportunities: data.guardianObservations.comfortableOpportunities?.trim(),
        thriveNotes: data.guardianObservations.thriveNotes?.trim(),
      };
      
      if (obs.strengths || obs.comesAlive || obs.comfortableOpportunities || obs.thriveNotes) {
        processedObservations = {};
        if (obs.strengths) processedObservations.strengths = obs.strengths;
        if (obs.comesAlive) processedObservations.comesAlive = obs.comesAlive;
        if (obs.comfortableOpportunities) processedObservations.comfortableOpportunities = obs.comfortableOpportunities;
        if (obs.thriveNotes) processedObservations.thriveNotes = obs.thriveNotes;
      }
    }

    const processedGrowingWithJesus: DiscoverProfileInput["answers"]["growingWithJesus"] = {
      interests: data.answers.growingWithJesus.interests,
    };

    const helperName = data.answers.growingWithJesus.helperName?.trim();
    if (helperName) processedGrowingWithJesus.helperName = helperName;

    const wantsHelpWith = data.answers.growingWithJesus.wantsHelpWith?.trim();
    if (wantsHelpWith) processedGrowingWithJesus.wantsHelpWith = wantsHelpWith;

    const payload: DiscoverProfileInput = {
      churchSlug: slug,
      journeyToken: localStorage.getItem("every-part-journey-token") || undefined,
      age: initialAge,
      birthdate: initialBirthdate,
      profileType: "discover",
      child: data.child,
      answers: {
        ...data.answers,
        growingWithJesus: processedGrowingWithJesus,
      },
      guardianObservations: processedObservations,
      guardian: {
        name: data.guardian.name,
        email: data.guardian.email,
        consent: true,
      }
    };

    submitProfile.mutate({ data: payload }, {
      onSuccess: (result) => {
         localStorage.setItem("every-part-journey-token", result.journeyToken);
        localStorage.removeItem(`every-part-discover-draft-${slug}`);
        setLocation(`/discover/result/${result.resultToken}`);
      },
      onError: () => {
        alert("There was an error saving your profile. Please try again.");
      }
    });
  };

  if (churchLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Church not found.</p>
      </div>
    );
  }

  // --- Reusable UI components ---
  const SingleSelectCard = ({ value, onChange, options }: { 
    value?: string, 
    onChange: (v: string) => void, 
    options: {id: string, label: string}[] 
  }) => (
    <div className="grid gap-3">
      {options.map(opt => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              isSelected 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? "border-primary" : "border-muted-foreground/30"
              }`}>
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className={`font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                {opt.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const MultiSelectPills = ({ value, onChange, options }: {
    value: string[],
    onChange: (v: string[]) => void,
    options: {id: string, label: string}[]
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              if (isSelected) {
                onChange(value.filter(v => v !== opt.id));
              } else {
                onChange([...value, opt.id]);
              }
            }}
            className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => setLocation(`/profile/${slug}`)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          {church.logoUrl ? (
            <img src={church.logoUrl} alt={church.name} className="h-8 object-contain" />
          ) : (
            <span className="font-serif font-medium">{church.name}</span>
          )}
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 w-auto justify-end">
            {savedFeedback && (
              <span className="flex items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">{savedFeedback}</span>
              </span>
            )}
            {saveDraftOptIn && (
              <button
                type="button"
                onClick={discardDraft}
                className="flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 px-2 py-1 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Discard draft</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-12">
        {/* Intro */}
        <div className="text-center space-y-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto text-secondary mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight">
            Discover Profile
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            For ages 6-8. This is a fun way to explore how God made you! 
            Grown-ups, help your child answer these questions. There are no wrong answers.
          </p>
          <div className="bg-primary/5 rounded-2xl p-6 text-left border border-primary/10 max-w-xl mx-auto mt-6">
            <h3 className="font-medium flex items-center gap-2 mb-2 text-primary">
              <Heart className="w-4 h-4" />
              Let's pray together
            </h3>
            <p className="text-primary/80 italic font-serif text-lg leading-relaxed">
              "Dear God, thank you for making me. Help me to learn more about how you made me, so I can share your love with others. Amen."
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: About Me */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-2 bg-primary/20" />
            <CardHeader className="bg-card pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base">First Name</Label>
                  <Input 
                    id="firstName" 
                    className={`text-lg py-5 ${errors.child?.firstName ? 'border-destructive' : ''}`}
                    {...form.register("child.firstName")} 
                  />
                  {errors.child?.firstName && <p className="text-sm text-destructive">{errors.child.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base">Last Name</Label>
                  <Input 
                    id="lastName" 
                    className={`text-lg py-5 ${errors.child?.lastName ? 'border-destructive' : ''}`}
                    {...form.register("child.lastName")} 
                  />
                  {errors.child?.lastName && <p className="text-sm text-destructive">{errors.child.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="likes" className="text-base font-normal">What are some things you really like to do for fun?</Label>
                <Controller
                  name="answers.aboutMe.likes"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="likes" 
                      className="min-h-[100px] text-base resize-y" 
                      placeholder="e.g., Playing soccer, reading books, drawing..."
                      value={field.value.join("\n")}
                      onChange={(e) => field.onChange(e.target.value.split("\n").filter(line => line.trim().length > 0))}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goodAt" className="text-base font-normal">What is something you are good at?</Label>
                <Textarea 
                  id="goodAt" 
                  className="min-h-[100px] text-base resize-y" 
                  placeholder="e.g., I'm a fast runner, I'm good at sharing..."
                  {...form.register("answers.aboutMe.goodAt")} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wantToLearn" className="text-base font-normal">What is something you want to learn how to do?</Label>
                <Textarea 
                  id="wantToLearn" 
                  className="min-h-[100px] text-base resize-y" 
                  placeholder="e.g., Learn to play piano, how to bake..."
                  {...form.register("answers.aboutMe.wantToLearn")} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: What Sounds Like Me */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-2 bg-secondary/20" />
            <CardHeader className="bg-card pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Star className="w-5 h-5 text-secondary" />
                What Sounds Like Me
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-10">
              <div className="space-y-3">
                <Label className="text-base font-medium">When I play, I usually feel happiest...</Label>
                <Controller
                  name="answers.tendencies.peopleEnergy"
                  control={control}
                  render={({ field }) => (
                    <SingleSelectCard
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { id: "love", label: "With a lot of people around" },
                        { id: "sometimes", label: "With just one or two good friends" },
                        { id: "quiet", label: "Playing quietly by myself" },
                      ]}
                    />
                  )}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">When we try something new, I like to...</Label>
                <Controller
                  name="answers.tendencies.newThings"
                  control={control}
                  render={({ field }) => (
                    <SingleSelectCard
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { id: "love", label: "Jump right in and try it!" },
                        { id: "sometimes", label: "Watch others do it first" },
                        { id: "not-yet", label: "Ask lots of questions about how it works" },
                      ]}
                    />
                  )}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">When someone needs help, I usually...</Label>
                <Controller
                  name="answers.tendencies.helpingResponse"
                  control={control}
                  render={({ field }) => (
                    <SingleSelectCard
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { id: "jump-in", label: "Notice right away and try to help" },
                        { id: "ask-first", label: "Help happily if a grown-up asks me to" },
                        { id: "prefer-support", label: "Prefer to keep focusing on what I was doing" },
                      ]}
                    />
                  )}
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="text-base font-medium">What kinds of things do you enjoy doing most? (Pick a few)</Label>
                <Controller
                  name="answers.tendencies.enjoys"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectPills value={field.value} onChange={field.onChange} options={ENJOYS_OPTIONS} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Cares & Helping */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-2 bg-accent/20" />
            <CardHeader className="bg-card pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Caring & Helping
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-10">
              <div className="space-y-3">
                <Label className="text-base font-medium">Who or what do you care about a lot right now? (Pick a few)</Label>
                <Controller
                  name="answers.caresAbout"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectPills value={field.value} onChange={field.onChange} options={CARES_ABOUT_OPTIONS} />
                  )}
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="text-base font-medium">How do you like to help out at home or school? (Pick a few)</Label>
                <Controller
                  name="answers.waysToHelp"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectPills value={field.value} onChange={field.onChange} options={LIKES_TO_HELP_OPTIONS} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Growing with Jesus */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-2 bg-primary/20" />
            <CardHeader className="bg-card pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary" />
                Growing With Jesus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-base font-medium">What are you curious about when it comes to Jesus and church? (Pick a few)</Label>
                <Controller
                  name="answers.growingWithJesus.interests"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectPills value={field.value} onChange={field.onChange} options={INTERESTS_OPTIONS} />
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border/40">
                <div className="space-y-2">
                  <Label htmlFor="helperName" className="text-base font-normal">Who is a grown-up at church you look up to?</Label>
                  <Input 
                    id="helperName" 
                    className="text-lg py-5"
                    placeholder="e.g., My Sunday school teacher, Pastor..."
                    {...form.register("answers.growingWithJesus.helperName")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wantsHelpWith" className="text-base font-normal">Is there anything you want help learning how to do?</Label>
                  <Input 
                    id="wantsHelpWith" 
                    className="text-lg py-5"
                    placeholder="e.g., How to read the Bible, how to pray..."
                    {...form.register("answers.growingWithJesus.wantsHelpWith")} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Things I Would Like to Try */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="h-2 bg-secondary/20" />
            <CardHeader className="bg-card pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <HandHeart className="w-5 h-5 text-secondary" />
                Things I Would Like To Try
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-muted-foreground text-base">
                How would you feel about trying these ways to serve at church?
              </p>
              
              <div className="space-y-4">
                {OPPORTUNITIES.map(opt => (
                  <div key={opt.id} className="p-4 rounded-xl border border-border/60 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="font-medium text-base">{opt.label}</span>
                    <Controller
                      name={`answers.opportunities.${opt.id}` as Path<FormValues>}
                      control={control}
                      render={({ field }) => (
                        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50 shrink-0">
                          {[
                            { val: "love", label: "Love it!" },
                            { val: "maybe", label: "Maybe" },
                            { val: "not-now", label: "Not now" }
                          ].map(choice => (
                            <button
                              key={choice.val}
                              type="button"
                              onClick={() => field.onChange(choice.val)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                field.value === choice.val 
                                  ? "bg-background text-foreground shadow-sm" 
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {choice.label}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Guardian Observations */}
          <Card className="border-border/60 shadow-sm overflow-hidden bg-muted/10">
            <div className="h-2 bg-muted-foreground/30" />
            <CardHeader className="bg-transparent pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-muted-foreground" />
                Grown-Up Observations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-muted-foreground">
                These questions are optional, but your perspective is a huge help to ministry leaders. 
                What do you notice about how God has wired your child?
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="strengths" className="text-base font-normal">What natural strengths or gifts do you see in them?</Label>
                  <Textarea 
                    id="strengths" 
                    className="min-h-[80px] bg-background" 
                    placeholder="e.g., Very observant, compassionate with animals, naturally takes charge of games..."
                    {...form.register("guardianObservations.strengths")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comesAlive" className="text-base font-normal">When do they seem to "come alive" or feel most joyful?</Label>
                  <Textarea 
                    id="comesAlive" 
                    className="min-h-[80px] bg-background" 
                    placeholder="e.g., When building complex Lego sets, when helping in the kitchen..."
                    {...form.register("guardianObservations.comesAlive")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comfortableOpportunities" className="text-base font-normal">Are there specific serving opportunities where you think they'd feel comfortable starting?</Label>
                  <Textarea 
                    id="comfortableOpportunities" 
                    className="min-h-[80px] bg-background" 
                    placeholder="e.g., Serving alongside me greeting at the door, helping sort food pantry items..."
                    {...form.register("guardianObservations.comfortableOpportunities")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thriveNotes" className="text-base font-normal">Is there anything else leaders should know to help your child thrive?</Label>
                  <Textarea 
                    id="thriveNotes" 
                    className="min-h-[80px] bg-background" 
                    placeholder="e.g., They are shy at first but warm up; they need clear instructions..."
                    {...form.register("guardianObservations.thriveNotes")} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Guardian Consent */}
          <Card className="border-primary/20 shadow-sm overflow-hidden border-2">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="font-serif text-xl font-medium mb-1">Guardian Approval</h3>
                    <p className="text-sm text-muted-foreground">
                      Please provide your details to finalize this profile. Your answers will be shared with approved ministry leaders to help care for and guide your child.
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Your Name</Label>
                      <Input 
                        id="guardianName" 
                        {...form.register("guardian.name")} 
                        className={errors.guardian?.name ? 'border-destructive' : ''}
                      />
                      {errors.guardian?.name && <p className="text-xs text-destructive">{errors.guardian.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianEmail">Your Email</Label>
                      <Input 
                        id="guardianEmail" 
                        type="email"
                        {...form.register("guardian.email")} 
                        className={errors.guardian?.email ? 'border-destructive' : ''}
                      />
                      {errors.guardian?.email && <p className="text-xs text-destructive">{errors.guardian.email.message}</p>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 mt-2">
                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox 
                        id="saveDraftOptIn" 
                        checked={saveDraftOptIn}
                        onCheckedChange={(checked) => {
                          setSaveDraftOptIn(checked === true);
                          if (!checked) {
                            localStorage.removeItem(`every-part-discover-draft-${slug}`);
                            setSavedFeedback("Draft removed from this device.");
                            setTimeout(() => setSavedFeedback(""), 3000);
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="space-y-1 leading-none">
                        <label
                          htmlFor="saveDraftOptIn"
                          className="text-sm font-medium leading-relaxed cursor-pointer"
                        >
                          Save my progress on this device for 24 hours. (Do not check this on a shared or public computer).
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Controller
                      name="guardian.consent"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="consent" 
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                            className={`mt-1 ${errors.guardian?.consent ? 'border-destructive' : ''}`}
                          />
                          <div className="space-y-1 leading-none">
                            <label
                              htmlFor="consent"
                              className="text-sm font-medium leading-relaxed cursor-pointer"
                            >
                              I consent to sharing this information with church ministry leaders to support my child's spiritual growth and serving journey.
                            </label>
                            {errors.guardian?.consent && (
                              <p className="text-xs text-destructive">{errors.guardian.consent.message}</p>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
                  Please fix the errors above before continuing.
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-base font-medium py-6"
                disabled={submitProfile.isPending}
              >
                {submitProfile.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 mr-2" />
                )}
                Submit Profile
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
