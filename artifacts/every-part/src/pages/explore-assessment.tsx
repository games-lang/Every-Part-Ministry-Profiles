import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetPublicChurch,
  useSubmitExploreProfile,
  type ExploreProfileInput
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Sprout,
  HandHeart,
  Lightbulb,
  Check,
  ShieldCheck,
  Save,
  Loader2,
  Trash2,
  Compass,
} from "lucide-react";
import { profileSubmissionError } from "@/lib/profile-submission-error";

// --- Form Schema ---
const formSchema = z.object({
  child: z.object({
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
  }),
  answers: z.object({
    aboutMe: z.object({
      likes: z.array(z.string()).min(1, "Select at least 1").max(8, "Select up to 8").default([]),
      goodAt: z.string().min(1, "Please tell us what you are good at").max(300),
      wantToLearn: z.string().min(1, "Please tell us what you want to learn").max(300),
    }),
    howITendToOperate: z.object({
      peopleEnergy: z.enum(["being-with-people", "mix-of-both", "quiet-time"]),
      decisionStyle: z.enum(["talk-it-out", "think-it-through", "try-and-see"]),
      planningStyle: z.enum(["plan-ahead", "little-plan", "go-with-the-flow"]),
      focusStyle: z.enum(["one-thing", "switch-it-up", "notice-details"]),
      actionStyle: z.enum(["jump-in", "help-behind-scenes", "ask-first"]),
      reflection: z.string().max(300).optional(),
    }),
    peopleAndNeeds: z.array(z.string()).min(1, "Select at least 1").max(8, "Select up to 8").default([]),
    waysIEnjoyHelping: z.array(z.string()).min(1, "Select at least 1").max(8, "Select up to 8").default([]),
    growingWithJesus: z.object({
      interests: z.array(z.string()).min(1, "Select at least 1").max(8).default([]),
      helperName: z.string().max(120).optional(),
      wantsHelpWith: z.string().max(300).optional(),
    }),
    opportunities: z.object({
      welcome: z.enum(["love", "maybe", "not-now"]).optional(),
      prayer: z.enum(["love", "maybe", "not-now"]).optional(),
      kids: z.enum(["love", "maybe", "not-now"]).optional(),
      worship: z.enum(["love", "maybe", "not-now"]).optional(),
      scriptureReading: z.enum(["love", "maybe", "not-now"]).optional(),
      production: z.enum(["love", "maybe", "not-now"]).optional(),
      communityCare: z.enum(["love", "maybe", "not-now"]).optional(),
      missions: z.enum(["love", "maybe", "not-now"]).optional(),
      encouragementCards: z.enum(["love", "maybe", "not-now"]).optional(),
      hospitality: z.enum(["love", "maybe", "not-now"]).optional(),
      setup: z.enum(["love", "maybe", "not-now"]).optional(),
      creative: z.enum(["love", "maybe", "not-now"]).optional(),
      events: z.enum(["love", "maybe", "not-now"]).optional(),
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
const LIKES_OPTIONS = [
  { id: "building", label: "Building things" },
  { id: "creating", label: "Creating art or music" },
  { id: "moving", label: "Moving around and being active" },
  { id: "talking", label: "Talking and sharing stories" },
  { id: "listening", label: "Listening to others" },
  { id: "organizing", label: "Organizing and sorting" },
  { id: "learning", label: "Learning new facts" },
  { id: "caring", label: "Caring for living things" },
  { id: "games", label: "Playing games" },
  { id: "outdoors", label: "Being outdoors" },
];

const PEOPLE_NEEDS_OPTIONS = [
  { id: "children", label: "Children" },
  { id: "friends", label: "Friends" },
  { id: "lonely", label: "Lonely or hurting people" },
  { id: "dont-know-jesus", label: "People who don’t know Jesus" },
  { id: "newcomers", label: "Newcomers" },
  { id: "disabilities", label: "People with disabilities" },
  { id: "older-adults", label: "Older adults" },
  { id: "poverty", label: "People experiencing poverty" },
  { id: "immigrants", label: "Immigrants and refugees" },
  { id: "cultures", label: "Other cultures and missions" },
  { id: "animals", label: "Animals and creation" },
  { id: "neighborhood", label: "My neighborhood" },
  { id: "justice", label: "Justice and fairness" },
];

const WAYS_TO_HELP_OPTIONS = [
  { id: "encouraging", label: "Encouraging" },
  { id: "leading", label: "Leading" },
  { id: "organizing", label: "Organizing" },
  { id: "teaching", label: "Teaching" },
  { id: "serving", label: "Serving" },
  { id: "welcoming", label: "Welcoming" },
  { id: "creating", label: "Creating" },
  { id: "giving", label: "Giving" },
  { id: "praying", label: "Praying" },
  { id: "listening", label: "Listening" },
  { id: "solving", label: "Solving problems" },
  { id: "making", label: "Making things" },
  { id: "music", label: "Music" },
  { id: "technology", label: "Technology" },
  { id: "helping-younger", label: "Helping younger children" },
  { id: "inviting", label: "Inviting others" },
  { id: "behind-scenes", label: "Behind the scenes" },
];

const INTERESTS_OPTIONS = [
  { id: "prayer", label: "Prayer" },
  { id: "bible", label: "The Bible" },
  { id: "worship", label: "Worship" },
  { id: "asking-questions", label: "Asking questions" },
  { id: "serving", label: "Serving others" },
  { id: "talking-about-jesus", label: "Talking about Jesus" },
  { id: "christian-adults", label: "Learning from Christian adults" },
];

const OPPORTUNITIES = [
  { id: "welcome", label: "Welcoming people or handing out bulletins" },
  { id: "prayer", label: "Praying for people in our church" },
  { id: "kids", label: "Helping with younger kids" },
  { id: "worship", label: "Singing or playing an instrument" },
  { id: "scriptureReading", label: "Reading Scripture out loud" },
  { id: "production", label: "Helping with lights or sound" },
  { id: "communityCare", label: "Helping people in our community" },
  { id: "missions", label: "Learning about or helping with missions" },
  { id: "encouragementCards", label: "Drawing or writing encouragement cards" },
  { id: "hospitality", label: "Helping set up snacks or drinks" },
  { id: "setup", label: "Helping set up chairs or equipment" },
  { id: "creative", label: "Drawing, taking photos, or making art" },
  { id: "events", label: "Helping at special church events" },
];

const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function ExploreAssessment({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const ageQuery = searchParams.get("age");
  const initialAge = ageQuery ? Number(ageQuery) : NaN;
  const initialBirthdate = searchParams.get("birthdate") || undefined;
  
  if (!initialAge || isNaN(initialAge) || initialAge < 9 || initialAge > 12) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
        <Card className="w-full max-w-md border-border/60 shadow-lg text-center landing-reveal is-visible">
          <CardContent className="p-8">
            <h2 className="text-xl font-serif font-medium mb-3">Age Required</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              This assessment is designed for ages 9-12. Please restart to verify your age.
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
  const submitProfile = useSubmitExploreProfile();

  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 7;
  
  const [saveDraftOptIn, setSaveDraftOptIn] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState("");
  const autoSaveTimerRef = useRef<NodeJS.Timeout>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      child: { firstName: "", lastName: "" },
      answers: {
        aboutMe: { likes: [], goodAt: "", wantToLearn: "" },
        howITendToOperate: {
          peopleEnergy: undefined as any,
          decisionStyle: undefined as any,
          planningStyle: undefined as any,
          focusStyle: undefined as any,
          actionStyle: undefined as any,
          reflection: "",
        },
        peopleAndNeeds: [],
        waysIEnjoyHelping: [],
        growingWithJesus: { interests: [], helperName: "", wantsHelpWith: "" },
        opportunities: {},
      },
      guardianObservations: {
        strengths: "",
        comesAlive: "",
        comfortableOpportunities: "",
        thriveNotes: "",
      },
      guardian: { name: "", email: "", consent: undefined as any },
    },
    mode: "onChange",
  });

  const { watch, control, formState: { errors } } = form;
  const formValues = watch();

  useEffect(() => {
    const draftStr = localStorage.getItem(`every-part-explore-draft-${slug}`);
    if (draftStr) {
      try {
        const parsed = JSON.parse(draftStr);
        if (Date.now() - parsed.timestamp < DRAFT_EXPIRY_MS) {
          form.reset(parsed.data);
          setSaveDraftOptIn(true);
        } else {
          localStorage.removeItem(`every-part-explore-draft-${slug}`);
        }
      } catch (e) {
        // ignore invalid drafts
      }
    }
  }, [slug, form]);

  useEffect(() => {
    if (saveDraftOptIn) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const dataToSave = JSON.parse(JSON.stringify(formValues));
        if (dataToSave.guardian) {
          delete dataToSave.guardian.consent; // Never save consent
        }
        localStorage.setItem(`every-part-explore-draft-${slug}`, JSON.stringify({
          timestamp: Date.now(),
          data: dataToSave
        }));
        setSavedFeedback("Draft saved");
        setTimeout(() => setSavedFeedback(""), 2000);
      }, 1000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formValues, saveDraftOptIn, slug]);

  const validateSection = async (section: number) => {
    let isValid = true;
    const values = form.getValues();
    
    if (section === 1) {
      if (!values.child.firstName?.trim()) {
        form.setError("child.firstName", { type: "manual", message: "First name is required" });
        isValid = false;
      } else { form.clearErrors("child.firstName"); }
      
      if (!values.child.lastName?.trim()) {
        form.setError("child.lastName", { type: "manual", message: "Last name is required" });
        isValid = false;
      } else { form.clearErrors("child.lastName"); }

      if (!values.answers.aboutMe.likes?.length) {
        form.setError("answers.aboutMe.likes", { type: "manual", message: "Select at least 1" });
        isValid = false;
      } else { form.clearErrors("answers.aboutMe.likes"); }

      if (!values.answers.aboutMe.goodAt?.trim()) {
        form.setError("answers.aboutMe.goodAt", { type: "manual", message: "Please tell us what you are good at" });
        isValid = false;
      } else { form.clearErrors("answers.aboutMe.goodAt"); }

      if (!values.answers.aboutMe.wantToLearn?.trim()) {
        form.setError("answers.aboutMe.wantToLearn", { type: "manual", message: "Please tell us what you want to learn" });
        isValid = false;
      } else { form.clearErrors("answers.aboutMe.wantToLearn"); }
    } else if (section === 2) {
      const ops = ["peopleEnergy", "decisionStyle", "planningStyle", "focusStyle", "actionStyle"];
      for (const op of ops) {
        if (!values.answers.howITendToOperate[op as keyof typeof values.answers.howITendToOperate]) {
          form.setError(`answers.howITendToOperate.${op}` as any, { type: "manual", message: "Please make a selection" });
          isValid = false;
        } else {
          form.clearErrors(`answers.howITendToOperate.${op}` as any);
        }
      }
    } else if (section === 3) {
      if (!values.answers.peopleAndNeeds?.length) {
        form.setError("answers.peopleAndNeeds", { type: "manual", message: "Select at least 1" });
        isValid = false;
      } else { form.clearErrors("answers.peopleAndNeeds"); }
    } else if (section === 4) {
      if (!values.answers.waysIEnjoyHelping?.length) {
        form.setError("answers.waysIEnjoyHelping", { type: "manual", message: "Select at least 1" });
        isValid = false;
      } else { form.clearErrors("answers.waysIEnjoyHelping"); }
    } else if (section === 5) {
      if (!values.answers.growingWithJesus.interests?.length) {
        form.setError("answers.growingWithJesus.interests", { type: "manual", message: "Select at least 1" });
        isValid = false;
      } else { form.clearErrors("answers.growingWithJesus.interests"); }
    } else if (section === 6) {
      const opps = values.answers.opportunities;
      const count = Object.values(opps || {}).filter(v => v !== "not-now").length;
      if (count < 2) {
        form.setError("answers.opportunities" as any, { 
          type: "manual", 
          message: "Choose at least two opportunities you would love or might like to try." 
        });
        isValid = false;
      } else {
        form.clearErrors("answers.opportunities" as any);
      }
    }
    
    return isValid;
  };

  const nextSection = async () => {
    const isValid = await validateSection(currentSection);
    if (isValid) {
      setCurrentSection(prev => Math.min(totalSections, prev + 1));
      window.scrollTo(0, 0);
    }
  };

  const prevSection = () => {
    setCurrentSection(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const discardDraft = () => {
    localStorage.removeItem(`every-part-explore-draft-${slug}`);
    setSaveDraftOptIn(false);
    form.reset({
      child: { firstName: "", lastName: "" },
      answers: {
        aboutMe: { likes: [], goodAt: "", wantToLearn: "" },
        howITendToOperate: {
          peopleEnergy: undefined as any,
          decisionStyle: undefined as any,
          planningStyle: undefined as any,
          focusStyle: undefined as any,
          actionStyle: undefined as any,
          reflection: "",
        },
        peopleAndNeeds: [],
        waysIEnjoyHelping: [],
        growingWithJesus: { interests: [], helperName: "", wantsHelpWith: "" },
        opportunities: {},
      },
      guardianObservations: {
        strengths: "",
        comesAlive: "",
        comfortableOpportunities: "",
        thriveNotes: "",
      },
      guardian: { name: "", email: "", consent: undefined as any },
    });
    setCurrentSection(1);
    setSavedFeedback("Draft discarded.");
    setTimeout(() => setSavedFeedback(""), 3000);
  };

  const onSubmit = (values: FormValues) => {
    let isS7Valid = true;
    if (!values.guardian.name?.trim()) {
      form.setError("guardian.name", { type: "manual", message: "Guardian name is required" });
      isS7Valid = false;
    } else { form.clearErrors("guardian.name"); }

    if (!values.guardian.email?.trim() || !/^\S+@\S+\.\S+$/.test(values.guardian.email)) {
      form.setError("guardian.email", { type: "manual", message: "Valid email is required" });
      isS7Valid = false;
    } else { form.clearErrors("guardian.email"); }

    if (values.guardian.consent !== true) {
      form.setError("guardian.consent", { type: "manual", message: "Consent is required" });
      isS7Valid = false;
    } else { form.clearErrors("guardian.consent"); }

    if (!isS7Valid) {
      return;
    }

    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((err: any) => {
         form.setError(err.path.join(".") as any, { type: "manual", message: err.message });
      });
      form.setError("root", { type: "manual", message: "Please check previous steps for missing information." });
      return;
    }

    if (!initialAge || isNaN(initialAge)) {
      form.setError("root", { type: "manual", message: "Missing age. Please go back and enter an age." });
      return;
    }

    const answers = { ...values.answers };

    // Clean up empty optional strings
    if (!answers.growingWithJesus.helperName?.trim()) delete answers.growingWithJesus.helperName;
    if (!answers.growingWithJesus.wantsHelpWith?.trim()) delete answers.growingWithJesus.wantsHelpWith;
    if (!answers.howITendToOperate.reflection?.trim()) delete answers.howITendToOperate.reflection;
    
    // Clean up observations
    let processedObservations: ExploreProfileInput["guardianObservations"] = undefined;
    if (values.guardianObservations) {
      const obs = {
        strengths: values.guardianObservations.strengths?.trim(),
        comesAlive: values.guardianObservations.comesAlive?.trim(),
        comfortableOpportunities: values.guardianObservations.comfortableOpportunities?.trim(),
        thriveNotes: values.guardianObservations.thriveNotes?.trim(),
      };
      
      if (obs.strengths || obs.comesAlive || obs.comfortableOpportunities || obs.thriveNotes) {
        processedObservations = {};
        if (obs.strengths) processedObservations.strengths = obs.strengths;
        if (obs.comesAlive) processedObservations.comesAlive = obs.comesAlive;
        if (obs.comfortableOpportunities) processedObservations.comfortableOpportunities = obs.comfortableOpportunities;
        if (obs.thriveNotes) processedObservations.thriveNotes = obs.thriveNotes;
      }
    }

    const processedOpportunities = { ...answers.opportunities };
    for (const key of Object.keys(processedOpportunities) as Array<keyof typeof processedOpportunities>) {
      if (!processedOpportunities[key]) {
        delete processedOpportunities[key];
      }
    }

    const payload: ExploreProfileInput = {
      churchSlug: slug,
      age: initialAge,
      journeyToken: localStorage.getItem("every-part-journey-token") || undefined,
      ...(initialBirthdate ? { birthdate: initialBirthdate } : {}),
      profileType: "explore",
      child: {
        firstName: values.child.firstName.trim(),
        lastName: values.child.lastName.trim(),
      },
      guardian: {
        name: values.guardian.name.trim(),
        email: values.guardian.email.trim(),
        consent: values.guardian.consent,
      },
      answers: {
        aboutMe: {
          likes: answers.aboutMe.likes,
          goodAt: answers.aboutMe.goodAt.trim(),
          wantToLearn: answers.aboutMe.wantToLearn.trim(),
        },
        howITendToOperate: {
          peopleEnergy: answers.howITendToOperate.peopleEnergy,
          decisionStyle: answers.howITendToOperate.decisionStyle,
          planningStyle: answers.howITendToOperate.planningStyle,
          focusStyle: answers.howITendToOperate.focusStyle,
          actionStyle: answers.howITendToOperate.actionStyle,
          ...(answers.howITendToOperate.reflection ? { reflection: answers.howITendToOperate.reflection } : {}),
        },
        peopleAndNeeds: answers.peopleAndNeeds,
        waysIEnjoyHelping: answers.waysIEnjoyHelping,
        growingWithJesus: {
          interests: answers.growingWithJesus.interests,
          ...(answers.growingWithJesus.helperName ? { helperName: answers.growingWithJesus.helperName } : {}),
          ...(answers.growingWithJesus.wantsHelpWith ? { wantsHelpWith: answers.growingWithJesus.wantsHelpWith } : {}),
        },
        opportunities: processedOpportunities,
      },
      ...(processedObservations ? { guardianObservations: processedObservations } : {}),
    };

    submitProfile.mutate({ data: payload }, {
      onSuccess: (result) => {
        localStorage.setItem("every-part-journey-token", result.journeyToken);
        localStorage.removeItem(`every-part-explore-draft-${slug}`);
        setLocation(`/explore/result/${result.resultToken}`);
      },
      onError: (error) => alert(profileSubmissionError(error)),
    });
  };

  if (churchLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

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
            aria-pressed={isSelected}
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

  const MultiSelectPills = ({ value, onChange, options, limit = 8 }: {
    value: string[],
    onChange: (v: string[]) => void,
    options: {id: string, label: string}[],
    limit?: number
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = value.includes(opt.id);
        const disabled = !isSelected && value.length >= limit;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => {
              if (isSelected) {
                onChange(value.filter(v => v !== opt.id));
              } else if (!disabled) {
                onChange([...value, opt.id]);
              }
            }}
            className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : disabled 
                  ? "border-border/50 bg-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-60"
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
    <div className="min-h-[100dvh] bg-background ep-landing pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {church?.logoUrl ? (
              <img src={church.logoUrl} alt={church.name} className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Compass className="w-4 h-4 text-primary" />
              </div>
            )}
            <span className="font-serif font-medium hidden sm:inline-block">Explore Profile</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-muted-foreground">Step {currentSection} of {totalSections}</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(currentSection / totalSections) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8 sm:pt-12">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {currentSection === 1 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">About Me</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  Let's start with some basic information about you.
                </p>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        {...form.register("child.firstName")} 
                        className={errors.child?.firstName ? 'border-destructive' : ''}
                      />
                      {errors.child?.firstName && <p className="text-xs text-destructive">{errors.child.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        {...form.register("child.lastName")}
                        className={errors.child?.lastName ? 'border-destructive' : ''} 
                      />
                      {errors.child?.lastName && <p className="text-xs text-destructive">{errors.child.lastName.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg">What do you enjoy for fun?</Label>
                    <p className="text-sm text-muted-foreground mb-4">Select up to 8 things you really like.</p>
                    <Controller
                      name="answers.aboutMe.likes"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectPills 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={LIKES_OPTIONS} 
                        />
                      )}
                    />
                    {errors.answers?.aboutMe?.likes && <p className="text-xs text-destructive">{errors.answers.aboutMe.likes.message}</p>}
                  </div>

                  <div className="space-y-3 pt-6 border-t border-border/40">
                    <Label htmlFor="goodAt" className="text-lg">What are you good at?</Label>
                    <Textarea 
                      id="goodAt" 
                      placeholder="I am good at..."
                      className={`min-h-[100px] resize-y ${errors.answers?.aboutMe?.goodAt ? 'border-destructive' : ''}`}
                      {...form.register("answers.aboutMe.goodAt")} 
                    />
                    {errors.answers?.aboutMe?.goodAt && <p className="text-xs text-destructive">{errors.answers.aboutMe.goodAt.message}</p>}
                  </div>

                  <div className="space-y-3 pt-6 border-t border-border/40">
                    <Label htmlFor="wantToLearn" className="text-lg">What would you like to learn?</Label>
                    <Textarea 
                      id="wantToLearn" 
                      placeholder="I would like to learn how to..."
                      className={`min-h-[100px] resize-y ${errors.answers?.aboutMe?.wantToLearn ? 'border-destructive' : ''}`}
                      {...form.register("answers.aboutMe.wantToLearn")} 
                    />
                    {errors.answers?.aboutMe?.wantToLearn && <p className="text-xs text-destructive">{errors.answers.aboutMe.wantToLearn.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === 2 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Compass className="w-8 h-8 text-secondary" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">How I Tend to Operate</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  There are no right or wrong answers. Just pick the one that sounds most like you.
                </p>
              </div>

              <div className="grid gap-6">
                <Card className={errors.answers?.howITendToOperate?.peopleEnergy ? "border-destructive shadow-sm" : "border-border/60 shadow-sm"}>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <Label className="text-lg">Where do you get your energy?</Label>
                    <Controller
                      name="answers.howITendToOperate.peopleEnergy"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectCard 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={[
                            { id: "being-with-people", label: "Being with people" },
                            { id: "mix-of-both", label: "A mix of both" },
                            { id: "quiet-time", label: "Having quiet time" },
                          ]} 
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className={errors.answers?.howITendToOperate?.decisionStyle ? "border-destructive shadow-sm" : "border-border/60 shadow-sm"}>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <Label className="text-lg">How do you like to make decisions?</Label>
                    <Controller
                      name="answers.howITendToOperate.decisionStyle"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectCard 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={[
                            { id: "talk-it-out", label: "Talk it out with others" },
                            { id: "think-it-through", label: "Think it through first" },
                            { id: "try-and-see", label: "Try it and see what happens" },
                          ]} 
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className={errors.answers?.howITendToOperate?.planningStyle ? "border-destructive shadow-sm" : "border-border/60 shadow-sm"}>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <Label className="text-lg">How do you feel about planning?</Label>
                    <Controller
                      name="answers.howITendToOperate.planningStyle"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectCard 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={[
                            { id: "plan-ahead", label: "Have a clear plan ahead of time" },
                            { id: "little-plan", label: "Have a little bit of a plan" },
                            { id: "go-with-the-flow", label: "Be flexible and go with the flow" },
                          ]} 
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className={errors.answers?.howITendToOperate?.focusStyle ? "border-destructive shadow-sm" : "border-border/60 shadow-sm"}>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <Label className="text-lg">How do you prefer to focus?</Label>
                    <Controller
                      name="answers.howITendToOperate.focusStyle"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectCard 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={[
                            { id: "one-thing", label: "Focus on one thing at a time" },
                            { id: "switch-it-up", label: "Switch between different things" },
                            { id: "notice-details", label: "Notice the small details" },
                          ]} 
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className={errors.answers?.howITendToOperate?.actionStyle ? "border-destructive shadow-sm" : "border-border/60 shadow-sm"}>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <Label className="text-lg">When it's time to act, what do you do?</Label>
                    <Controller
                      name="answers.howITendToOperate.actionStyle"
                      control={control}
                      render={({ field }) => (
                        <SingleSelectCard 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={[
                            { id: "jump-in", label: "Jump right in and start" },
                            { id: "help-behind-scenes", label: "Help out behind the scenes" },
                            { id: "ask-first", label: "Ask for instructions first" },
                          ]} 
                        />
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentSection === 3 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-chart-2" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">People and Needs I Care About</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  What kinds of people or causes pull at your heart? 
                </p>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg">Select up to 8 things you care deeply about.</Label>
                    <Controller
                      name="answers.peopleAndNeeds"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectPills 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={PEOPLE_NEEDS_OPTIONS} 
                        />
                      )}
                    />
                    {errors.answers?.peopleAndNeeds && <p className="text-xs text-destructive">{errors.answers.peopleAndNeeds.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === 4 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto mb-4">
                  <HandHeart className="w-8 h-8 text-chart-1" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">Ways I Enjoy Helping</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  How do you like to help others?
                </p>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg">Select up to 8 ways you enjoy helping.</Label>
                    <Controller
                      name="answers.waysIEnjoyHelping"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectPills 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={WAYS_TO_HELP_OPTIONS} 
                        />
                      )}
                    />
                    {errors.answers?.waysIEnjoyHelping && <p className="text-xs text-destructive">{errors.answers.waysIEnjoyHelping.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === 5 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-8 h-8 text-chart-3" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">Growing With Jesus</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  Every part of the church is growing together.
                </p>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg">What are you most interested in right now?</Label>
                    <Controller
                      name="answers.growingWithJesus.interests"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectPills 
                          value={field.value} 
                          onChange={field.onChange} 
                          options={INTERESTS_OPTIONS} 
                        />
                      )}
                    />
                    {errors.answers?.growingWithJesus?.interests && <p className="text-xs text-destructive">{errors.answers.growingWithJesus.interests.message}</p>}
                  </div>

                  <div className="space-y-3 pt-6 border-t border-border/40">
                    <Label htmlFor="helperName" className="text-lg">Is there someone who helps you follow Jesus? (Optional)</Label>
                    <Input 
                      id="helperName" 
                      placeholder="Name of a person..."
                      {...form.register("answers.growingWithJesus.helperName")} 
                    />
                  </div>

                  <div className="space-y-3 pt-6 border-t border-border/40">
                    <Label htmlFor="wantsHelpWith" className="text-lg">What is something you would like help with, or something you wonder about God? (Optional)</Label>
                    <Textarea 
                      id="wantsHelpWith" 
                      placeholder="I wonder about..."
                      className="min-h-[100px] resize-y"
                      {...form.register("answers.growingWithJesus.wantsHelpWith")} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === 6 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-chart-4/10 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-chart-4" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">Ministry Opportunities</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  Here are some ways to help around our church. How do you feel about trying these?
                </p>
              </div>

              <div className="grid gap-4">
                {OPPORTUNITIES.map((opp) => (
                  <Card key={opp.id} className="border-border/60 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                        <div className="p-4 sm:p-5 flex-1 bg-muted/20">
                          <span className="font-medium text-foreground">{opp.label}</span>
                        </div>
                        <div className="p-3 sm:p-4 bg-card shrink-0">
                          <Controller
                            name={`answers.opportunities.${opp.id}` as any}
                            control={control}
                            render={({ field }) => (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  aria-pressed={field.value === "love"}
                                  onClick={() => field.onChange("love")}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    field.value === "love"
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:bg-muted text-muted-foreground"
                                  }`}
                                >
                                  I'd love to try this
                                </button>
                                <button
                                  type="button"
                                  aria-pressed={field.value === "maybe"}
                                  onClick={() => field.onChange("maybe")}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    field.value === "maybe"
                                      ? "border-chart-3 bg-chart-3/10 text-chart-3"
                                      : "border-border hover:bg-muted text-muted-foreground"
                                  }`}
                                >
                                  Maybe
                                </button>
                                <button
                                  type="button"
                                  aria-pressed={field.value === "not-now"}
                                  onClick={() => field.onChange("not-now")}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    field.value === "not-now"
                                      ? "border-muted-foreground/30 bg-muted text-foreground"
                                      : "border-border hover:bg-muted text-muted-foreground"
                                  }`}
                                >
                                  Not right now
                                </button>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {errors.answers?.opportunities && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 text-center font-medium">
                  {errors.answers.opportunities.message as string}
                </div>
              )}
            </div>
          )}

          {currentSection === 7 && (
            <div className="space-y-6 landing-reveal is-visible">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-serif font-medium mb-3">Guardian Observations</h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
                  Parents/guardians, please help us wrap up this profile.
                </p>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="strengths" className="text-lg">What are some natural strengths you see? (Optional)</Label>
                    <Textarea 
                      id="strengths" 
                      className="min-h-[80px]"
                      {...form.register("guardianObservations.strengths")} 
                    />
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border/40">
                    <Label htmlFor="comesAlive" className="text-lg">When do they seem to come most alive? (Optional)</Label>
                    <Textarea 
                      id="comesAlive" 
                      className="min-h-[80px]"
                      {...form.register("guardianObservations.comesAlive")} 
                    />
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border/40">
                    <Label htmlFor="comfortableOpportunities" className="text-lg">Which opportunities might they be most comfortable starting with? (Optional)</Label>
                    <Textarea 
                      id="comfortableOpportunities" 
                      className="min-h-[80px]"
                      {...form.register("guardianObservations.comfortableOpportunities")} 
                    />
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border/40">
                    <Label htmlFor="thriveNotes" className="text-lg">Are there any notes on how they learn, process, or thrive? (Optional)</Label>
                    <Textarea 
                      id="thriveNotes" 
                      className="min-h-[80px]"
                      {...form.register("guardianObservations.thriveNotes")} 
                    />
                  </div>
                </CardContent>
              </Card>

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
                                localStorage.removeItem(`every-part-explore-draft-${slug}`);
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

                  {Object.keys(errors).length > 0 && !errors.root && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
                      Please fix the errors above before continuing.
                    </div>
                  )}
                  {submitProfile.error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
                      Failed to submit profile. Please try again or check your answers.
                    </div>
                  )}
                  {errors.root && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
                      {errors.root.message}
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
            </div>
          )}

          {/* Navigation Controls */}
          {currentSection < totalSections && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/40">
              <div className="flex items-center gap-4">
                {currentSection > 1 ? (
                  <Button type="button" variant="outline" onClick={prevSection} size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" asChild>
                    <Link href={`/profile/${slug}`}>
                      Cancel
                    </Link>
                  </Button>
                )}
                
                {saveDraftOptIn && (
                  <Button type="button" variant="ghost" size="sm" onClick={discardDraft} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Discard Draft
                  </Button>
                )}

                {savedFeedback && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2 animate-in fade-in">
                    <Save className="w-4 h-4" />
                    {savedFeedback}
                  </span>
                )}
              </div>
              
              <Button type="button" onClick={nextSection} size="lg" className="px-8">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {currentSection === totalSections && (
            <div className="flex justify-between pt-6 mt-6">
              <Button type="button" variant="outline" onClick={prevSection} size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

        </form>
      </main>
    </div>
  );
}
