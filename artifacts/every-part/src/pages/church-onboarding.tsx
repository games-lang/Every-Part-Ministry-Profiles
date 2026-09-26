import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardSummaryQueryKey,
  getGetMyChurchQueryKey,
  useGetMyChurch,
  useUpdateMyChurch,
  type DashboardSummary,
  type MinistryCustomizationTradition,
  type SpiritualGiftName,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Loader2, Sparkles } from "lucide-react";
import {
  CHURCH_TRADITIONS,
  DEFAULT_MINISTRY_CUSTOMIZATION,
  STANDARD_MINISTRY_LABELS,
  recommendedMinistryLabels,
  recommendedSpiritualGifts,
} from "@/lib/ministry-customization";

const SPIRITUAL_GIFT_NAMES: SpiritualGiftName[] = [
  "Administration", "Apostleship", "Discernment of Spirits", "Evangelism",
  "Exhortation / Encouragement", "Faith", "Giving", "Healing", "Helps / Service",
  "Hospitality", "Interpretation of Tongues", "Knowledge", "Leadership", "Mercy",
  "Miracles", "Pastoring / Shepherding", "Prophecy", "Teaching", "Tongues",
  "Wisdom", "Craftsmanship", "Intercession", "Missionary / Cross-Cultural Ministry",
  "Music / Worship", "Celibacy", "Voluntary Poverty",
];

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Enter your church name").max(120),
  adminName: z.string().trim().min(1, "Enter your name").max(120),
  adminEmail: z.string().trim().min(1, "Enter a contact email").email("Enter a valid contact email"),
  mode: z.enum(["standard", "tradition", "custom"]),
  tradition: z.enum([
    "wesleyanHoliness", "nazarene", "methodist", "baptist",
    "pentecostalCharismatic", "assembliesOfGod", "presbyterianReformed",
    "lutheran", "anglicanEpiscopal", "catholic", "easternOrthodox",
    "nonDenominational", "independentEvangelical", "other", "preferNotToSpecify",
  ]),
  customTradition: z.string().max(120),
  spiritualGiftsLabel: z.string().trim().min(1).max(80),
  ministryInterestsLabel: z.string().trim().min(1).max(80),
  enabledSpiritualGifts: z.array(z.string()).min(3),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function ChurchOnboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: church, isLoading } = useGetMyChurch();
  const updateChurch = useUpdateMyChurch();
  const [step, setStep] = useState(0);
  const form = useForm<OnboardingValues>({
    defaultValues: {
      name: "",
      adminName: "",
      adminEmail: "",
      ...DEFAULT_MINISTRY_CUSTOMIZATION,
      customTradition: "",
      enabledSpiritualGifts: SPIRITUAL_GIFT_NAMES,
    },
  });

  useEffect(() => {
    if (!church) return;
    form.reset({
      name: church.name === "Your Church" ? "" : church.name,
      adminName: !church.onboardingCompletedAt && church.adminName === "Church Administrator" ? "" : church.adminName,
      adminEmail: !church.onboardingCompletedAt && church.adminEmail === "admin@example.com" ? "" : church.adminEmail,
      mode: church.ministryCustomization.mode,
      tradition: church.ministryCustomization.tradition,
      customTradition: church.ministryCustomization.customTradition || "",
      spiritualGiftsLabel: church.ministryCustomization.spiritualGiftsLabel,
      ministryInterestsLabel: church.ministryCustomization.ministryInterestsLabel,
      enabledSpiritualGifts: church.enabledSpiritualGifts || SPIRITUAL_GIFT_NAMES,
    });
  }, [church, form]);

  const mode = form.watch("mode");
  const tradition = form.watch("tradition");
  const giftNames = form.watch("enabledSpiritualGifts");

  const validateFields = (fields?: (keyof OnboardingValues)[]) => {
    const result = onboardingSchema.safeParse(form.getValues());
    const issues = result.success
      ? []
      : result.error.issues.filter((issue) => !fields || fields.includes(issue.path[0] as keyof OnboardingValues));
    form.clearErrors(fields);
    for (const issue of issues) {
      form.setError(issue.path[0] as keyof OnboardingValues, {
        type: issue.code,
        message: issue.message,
      });
    }
    return { valid: issues.length === 0, values: result.success ? result.data : null, issues };
  };

  const advance = () => {
    const fields: (keyof OnboardingValues)[] = step === 0
      ? ["name", "adminName", "adminEmail"]
      : step === 2 ? ["enabledSpiritualGifts"] : ["tradition", "customTradition"];
    if (validateFields(fields).valid) setStep(value => Math.min(3, value + 1));
  };

  const applyMode = (nextMode: OnboardingValues["mode"]) => {
    form.setValue("mode", nextMode, { shouldDirty: true });
    if (nextMode === "standard") {
      form.setValue("spiritualGiftsLabel", STANDARD_MINISTRY_LABELS.spiritualGiftsLabel);
      form.setValue("ministryInterestsLabel", STANDARD_MINISTRY_LABELS.ministryInterestsLabel);
      form.setValue("enabledSpiritualGifts", [...SPIRITUAL_GIFT_NAMES]);
    } else if (nextMode === "tradition") {
      const labels = recommendedMinistryLabels(tradition);
      form.setValue("spiritualGiftsLabel", labels.spiritualGiftsLabel);
      form.setValue("ministryInterestsLabel", labels.ministryInterestsLabel);
      form.setValue("enabledSpiritualGifts", recommendedSpiritualGifts(tradition, SPIRITUAL_GIFT_NAMES));
    }
  };

  const applyTradition = (nextTradition: MinistryCustomizationTradition) => {
    form.setValue("tradition", nextTradition, { shouldDirty: true });
    if (mode === "tradition") {
      const labels = recommendedMinistryLabels(nextTradition);
      form.setValue("spiritualGiftsLabel", labels.spiritualGiftsLabel);
      form.setValue("ministryInterestsLabel", labels.ministryInterestsLabel);
      form.setValue("enabledSpiritualGifts", recommendedSpiritualGifts(nextTradition, SPIRITUAL_GIFT_NAMES));
    }
  };

  const finish = (values: OnboardingValues) => {
    updateChurch.mutate({
      data: {
        name: values.name,
        adminName: values.adminName,
        adminEmail: values.adminEmail,
        enabledSpiritualGifts: values.enabledSpiritualGifts as SpiritualGiftName[],
        ministryCustomization: {
          version: 1,
          mode: values.mode,
          tradition: values.tradition,
          customTradition: values.tradition === "other" ? values.customTradition.trim() || null : null,
          spiritualGiftsLabel: values.spiritualGiftsLabel,
          ministryInterestsLabel: values.ministryInterestsLabel,
        },
        onboardingCompleted: true,
      },
    }, {
      onSuccess: async (updatedChurch) => {
        // Update both cached responses before navigating. Otherwise the
        // dashboard can briefly render its previous null completion state and
        // redirect back into onboarding.
        queryClient.setQueryData(getGetMyChurchQueryKey(), updatedChurch);
        queryClient.setQueryData<DashboardSummary | undefined>(
          getGetDashboardSummaryQueryKey(),
          (current) => current ? { ...current, church: updatedChurch } : current,
        );
        await queryClient.invalidateQueries();
        toast({ title: "Your church is ready", description: "You can change these settings any time in Church Setup." });
        setLocation("/dashboard");
      },
      onError: () => toast({
        title: "Could not finish setup",
        description: "Please check the form and try again.",
        variant: "destructive",
      }),
    });
  };

  if (isLoading || !church) {
    return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-12"><Skeleton className="h-10 w-72" /><Skeleton className="h-96 w-full" /></div>;
  }

  const steps = ["Welcome", "Tradition", "Gift starting point", "Review"];
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <BookOpenCheck className="h-5 w-5 text-primary" /> Every Part
          </Link>
        </div>
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">First-time church setup</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Shape Every Part for your church</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">A few choices help us use familiar language and give you a thoughtful starting point. You can change everything later.</p>
        </div>
        <div className="mb-8 grid grid-cols-4 gap-2" aria-label="Setup progress">
          {steps.map((label, index) => <div key={label} className="space-y-2"><div className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} /><p className={`text-xs ${index === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</p></div>)}
        </div>

        <Form {...form}>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (step < 3) {
              advance();
              return;
            }
            const result = validateFields();
            if (result.values) finish(result.values);
            else {
              const invalid = (field: keyof OnboardingValues) => result.issues.some((issue) => issue.path[0] === field);
              setStep(invalid("name") || invalid("adminName") || invalid("adminEmail") ? 0 : invalid("enabledSpiritualGifts") ? 2 : 1);
            }
          }}>
            <Card className="border-border/70 shadow-sm">
              {step === 0 && <><CardHeader><CardTitle className="font-serif text-2xl">Let&apos;s begin with the basics</CardTitle><CardDescription>Your church name appears on the public Ministry Profile entry page. Your name and contact email help your church stay in touch.</CardDescription></CardHeader><CardContent className="space-y-5"><FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Church name</FormLabel><FormControl><Input placeholder="e.g. Grace City Church" autoComplete="organization" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="adminName" render={({ field }) => <FormItem><FormLabel>Your name</FormLabel><FormControl><Input placeholder="e.g. Jordan Lee" autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="adminEmail" render={({ field }) => <FormItem><FormLabel>Contact email</FormLabel><FormControl><Input type="email" placeholder="you@yourchurch.org" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>} /></CardContent></>}
              {step === 1 && <><CardHeader><CardTitle className="font-serif text-2xl">Choose your starting language</CardTitle><CardDescription>Tradition offers suggestions, not theological judgments. Your church remains in control.</CardDescription></CardHeader><CardContent className="space-y-6"><FormField control={form.control} name="tradition" render={({ field }) => <FormItem><FormLabel>Tradition or affiliation</FormLabel><Select value={field.value} onValueChange={value => applyTradition(value as MinistryCustomizationTradition)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CHURCH_TRADITIONS.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />{tradition === "other" && <FormField control={form.control} name="customTradition" render={({ field }) => <FormItem><FormLabel>Tell us your tradition</FormLabel><FormControl><Input placeholder="Denomination or tradition" {...field} /></FormControl><FormMessage /></FormItem>} />}<FormField control={form.control} name="mode" render={({ field }) => <FormItem><FormLabel>How should we use this choice?</FormLabel><Select value={field.value} onValueChange={value => applyMode(value as OnboardingValues["mode"])}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="standard">Every Part Standard</SelectItem><SelectItem value="tradition">Recommended for our tradition</SelectItem><SelectItem value="custom">Church Custom</SelectItem></SelectContent></Select><FormMessage /></FormItem>} /></CardContent></>}
              {step === 2 && <><CardHeader><CardTitle className="font-serif text-2xl">Choose your gift starting list</CardTitle><CardDescription>{mode === "tradition" ? "We applied a tradition-based starting point. You can add or remove any gift before finishing." : "Select the gifts your church wants members to reflect on. Choose at least three."}</CardDescription></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2">{SPIRITUAL_GIFT_NAMES.map(gift => <label key={gift} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/40"><Checkbox checked={giftNames.includes(gift)} onCheckedChange={checked => form.setValue("enabledSpiritualGifts", checked ? [...giftNames, gift] : giftNames.filter(item => item !== gift), { shouldDirty: true })} /><span>{gift}</span></label>)}</div>{form.formState.errors.enabledSpiritualGifts && <p className="mt-3 text-sm text-destructive">Choose at least three gifts.</p>}</CardContent></>}
              {step === 3 && <><CardHeader><CardTitle className="flex items-center gap-2 font-serif text-2xl"><Sparkles className="h-5 w-5 text-accent" />Your member experience is ready to review</CardTitle><CardDescription>These labels will appear on new member assessments. You can refine them later in Church Setup.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Gift section</p><p className="mt-2 font-serif text-xl">{form.watch("spiritualGiftsLabel")}</p></div><div className="rounded-xl border p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Serving section</p><p className="mt-2 font-serif text-xl">{form.watch("ministryInterestsLabel")}</p></div><div className="rounded-xl border bg-muted/30 p-5 sm:col-span-2"><p className="font-medium">{`${giftNames.length} gifts selected`}</p><p className="mt-1 text-sm text-muted-foreground">{giftNames.join(", ")}</p></div></CardContent></>}
              <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                <Button type="button" variant="ghost" onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0 || updateChurch.isPending}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Back
                </Button>
                {step < 3 ? (
                  <Button key="continue" type="button" onClick={(event) => {
                    // The next render swaps this for a submit button; don't let
                    // the original click submit the form after that swap.
                    event.preventDefault();
                    advance();
                  }}>
                    Continue<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button key="finish" type="submit" disabled={updateChurch.isPending}>
                    {updateChurch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Finish setup
                  </Button>
                )}
              </div>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}