import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetPublicChurch, getGetPublicChurchQueryKey, useCreateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { HeartHandshake, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Schema mapped from Product Brief Options & Data Types
const assessmentSchema = z.object({
  basicInformation: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().optional(),
    ageRange: z.string().min(1, "Please select an age range"),
    preferredContact: z.string().min(1, "Please select a contact method"),
    familySituation: z.string().min(1, "Please select a family situation"),
    transportation: z.string().min(1, "Please indicate transportation"),
  }),
  churchConnection: z.object({
    attendanceLength: z.string().min(1, "Please select attendance length"),
    connectionLevel: z.coerce.number().min(1).max(5),
    followingJesusLength: z.string().min(1, "Please indicate how long you've followed Jesus"),
    servedBefore: z.boolean().default(false),
    previousService: z.string().optional(),
  }),
  passions: z.array(z.string()).min(1, "Select at least one passion"),
  interests: z.array(z.string()).min(1, "Select at least one interest area"),
  servingFrequency: z.string().min(1, "Please select serving frequency"),
  availability: z.array(z.string()).min(1, "Select at least one availability time"),
  skills: z.object({
    occupation: z.string().optional(),
    uniqueSkills: z.string().optional(),
    previousMinistryExperience: z.string().optional(),
    leadershipExperience: z.string().optional(),
    missionTripExperience: z.string().optional(),
    lifeExperience: z.string().optional(),
  })
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

const PASSION_OPTIONS = [
  "Children", "Youth", "College/Young Adults", "Young Families", "Marriage", 
  "Seniors", "Special Needs", "Homeless/Marginalized", "Single Parents", 
  "Hospitalized/Sick", "Grieving", "International/Refugee", "Prisoners"
];

const INTEREST_OPTIONS = [
  "Greeting/Hospitality", "Teaching/Leading", "Administration", "Worship/Music",
  "Tech/Production", "Creative/Arts", "Care/Prayer", "Facilities/Maintenance",
  "Events/Planning", "Finance/Counting", "Food/Meals", "Small Groups"
];

const AVAILABILITY_OPTIONS = [
  "Sunday Mornings", "Sunday Evenings", "Weekday Mornings", "Weekday Evenings",
  "Saturdays", "Flexible/Varies"
];

export default function Assessment() {
  const [, params] = useRoute("/profile/:slug");
  const slug = params?.slug;

  const { data: church, isLoading: isLoadingChurch, error: churchError } = useGetPublicChurch(slug || "", {
    query: { enabled: !!slug, queryKey: getGetPublicChurchQueryKey(slug || "") }
  });

  const createProfile = useCreateProfile();
  
  const [step, setStep] = useState(0); // 0 = Welcome, 1 = Basic, 2 = Church, 3 = Passions/Interests, 4 = Skills, 5 = Done
  
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      basicInformation: {
        firstName: "", lastName: "", email: "", phone: "",
        ageRange: "", preferredContact: "email", familySituation: "", transportation: "Yes"
      },
      churchConnection: {
        attendanceLength: "", connectionLevel: 3, followingJesusLength: "",
        servedBefore: false, previousService: ""
      },
      passions: [],
      interests: [],
      servingFrequency: "",
      availability: [],
      skills: {
        occupation: "", uniqueSkills: "", previousMinistryExperience: "",
        leadershipExperience: "", missionTripExperience: "", lifeExperience: ""
      }
    }
  });

  if (isLoadingChurch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (churchError || !church) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="font-serif text-3xl font-medium mb-2">Church Not Found</h1>
        <p className="text-muted-foreground mb-6">The assessment link appears to be invalid.</p>
        <Button asChild><Link href="/">Return Home</Link></Button>
      </div>
    );
  }

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['basicInformation'];
    if (step === 2) fieldsToValidate = ['churchConnection'];
    if (step === 3) fieldsToValidate = ['passions', 'interests', 'servingFrequency', 'availability'];
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any);
      if (!isValid) return;
    }
    
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: AssessmentFormValues) => {
    if (!slug) return;
    
    createProfile.mutate({
      data: {
        churchSlug: slug,
        basicInformation: data.basicInformation,
        churchConnection: {
          ...data.churchConnection,
          previousService: data.churchConnection.previousService || null,
        },
        passions: data.passions,
        interests: data.interests,
        servingFrequency: data.servingFrequency,
        availability: data.availability,
        skills: {
          occupation: data.skills.occupation || null,
          uniqueSkills: data.skills.uniqueSkills || null,
          previousMinistryExperience: data.skills.previousMinistryExperience || null,
          leadershipExperience: data.skills.leadershipExperience || null,
          missionTripExperience: data.skills.missionTripExperience || null,
          lifeExperience: data.skills.lifeExperience || null,
        }
      }
    }, {
      onSuccess: () => {
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const progress = (step / 4) * 100;

  // Render Welcome Screen
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 selection:bg-secondary/20 selection:text-secondary">
        <Card className="max-w-xl w-full border-none shadow-none bg-transparent">
          <CardContent className="text-center p-0 space-y-8">
            <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <HeartHandshake className="w-10 h-10" />
            </div>
            
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight mb-4">
                Welcome to <span className="text-primary">{church.name}</span>'s Ministry Profile
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                We believe God has uniquely wired every person. This brief assessment helps us understand your passions, gifts, and experience so we can help you find your place.
              </p>
            </div>

            <Button size="lg" onClick={() => setStep(1)} className="rounded-full px-10 h-14 text-lg font-medium bg-primary hover:bg-primary/90">
              Start Assessment <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Success Screen
  if (step === 5) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border-border/60 shadow-lg rounded-2xl overflow-hidden text-center">
          <div className="h-32 bg-primary flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-primary-foreground" />
          </div>
          <CardContent className="p-8 pt-10">
            <h2 className="font-serif text-3xl font-medium mb-4">Thank You!</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Your profile has been submitted to {church.name}. A team member will be in touch soon to discuss next steps and finding your fit.
            </p>
            <Button asChild variant="outline" className="rounded-full font-medium">
              <a href={church.profileUrl || "/"}>Return to Church Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Form Steps
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-3xl">
          <div className="font-serif font-medium text-lg text-foreground truncate">{church.name}</div>
          <div className="w-1/3 max-w-[200px]">
            <div className="text-xs text-muted-foreground text-right mb-1 font-medium">Step {step} of 4</div>
            <Progress value={progress} className="h-2 bg-muted [&>div]:bg-primary" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 md:p-10">
                
                {/* STEP 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h2 className="font-serif text-3xl font-medium tracking-tight mb-2">About You</h2>
                      <p className="text-muted-foreground">Let's start with the basics.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="basicInformation.firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="basicInformation.lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="basicInformation.email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="basicInformation.phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input type="tel" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="basicInformation.ageRange" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age Range</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Under 18", "18-25", "26-35", "36-45", "46-55", "56-65", "66+"].map(o => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="basicInformation.familySituation" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family/Life Stage</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select life stage" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Single", "Married", "Empty Nester", "Parent with Kids at Home", "Other"].map(o => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* STEP 2: Church Connection */}
                {step === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h2 className="font-serif text-3xl font-medium tracking-tight mb-2">Your Journey</h2>
                      <p className="text-muted-foreground">Tell us about your faith and connection to the church.</p>
                    </div>

                    <div className="space-y-6">
                      <FormField control={form.control} name="churchConnection.followingJesusLength" render={({ field }) => (
                        <FormItem>
                          <FormLabel>How long have you been following Jesus?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Still exploring", "Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"].map(o => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="churchConnection.attendanceLength" render={({ field }) => (
                        <FormItem>
                          <FormLabel>How long have you been attending {church.name}?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Just visiting", "Less than 6 months", "6 months - 1 year", "1-3 years", "3+ years"].map(o => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="churchConnection.connectionLevel" render={({ field }) => (
                        <FormItem>
                          <FormLabel>How connected do you feel here right now? (1 = Low, 5 = High)</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(level => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => field.onChange(level)}
                                  className={`w-12 h-12 rounded-full font-medium transition-all ${field.value === level ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="churchConnection.servedBefore" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/20">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Have you served on a team here before?</FormLabel>
                          </div>
                        </FormItem>
                      )} />

                      {form.watch('churchConnection.servedBefore') && (
                        <FormField control={form.control} name="churchConnection.previousService" render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-2">
                            <FormLabel>Where did you serve?</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: Passions & Interests */}
                {step === 3 && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h2 className="font-serif text-3xl font-medium tracking-tight mb-2">Passions & Interests</h2>
                      <p className="text-muted-foreground">What groups of people and types of work energize you?</p>
                    </div>

                    <FormField control={form.control} name="passions" render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-lg">People Passions</FormLabel>
                          <p className="text-sm text-muted-foreground">Who do you feel drawn to help? (Select all that apply)</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {PASSION_OPTIONS.map((item) => (
                            <FormField key={item} control={form.control} name="passions" render={({ field }) => {
                              return (
                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item])
                                          : field.onChange(field.value?.filter((value) => value !== item))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex-1">{item}</FormLabel>
                                </FormItem>
                              )
                            }} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="interests" render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-lg">Role Interests</FormLabel>
                          <p className="text-sm text-muted-foreground">What types of tasks do you enjoy? (Select all that apply)</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {INTEREST_OPTIONS.map((item) => (
                            <FormField key={item} control={form.control} name="interests" render={({ field }) => {
                              return (
                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item])
                                          : field.onChange(field.value?.filter((value) => value !== item))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex-1">{item}</FormLabel>
                                </FormItem>
                              )
                            }} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
                      <FormField control={form.control} name="servingFrequency" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ideal Serving Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Weekly", "Bi-weekly", "Once a month", "Occasional/Events only"].map(o => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="availability" render={() => (
                        <FormItem>
                          <FormLabel>Availability</FormLabel>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {AVAILABILITY_OPTIONS.map((item) => (
                              <FormField key={item} control={form.control} name="availability" render={({ field }) => {
                                const isChecked = field.value?.includes(item);
                                return (
                                  <Button
                                    key={item}
                                    type="button"
                                    variant={isChecked ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      isChecked 
                                        ? field.onChange(field.value?.filter(v => v !== item))
                                        : field.onChange([...field.value, item]);
                                    }}
                                    className={`rounded-full ${isChecked ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent' : ''}`}
                                  >
                                    {item}
                                  </Button>
                                )
                              }} />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                  </div>
                )}

                {/* STEP 4: Skills */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h2 className="font-serif text-3xl font-medium tracking-tight mb-2">Skills & Experience</h2>
                      <p className="text-muted-foreground">Optional, but helpful context for leadership.</p>
                    </div>

                    <FormField control={form.control} name="skills.occupation" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Occupation / Field of Study</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="skills.uniqueSkills" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unique Skills</FormLabel>
                        <FormDescription>Photography, accounting, woodworking, sign language, etc.</FormDescription>
                        <FormControl><Textarea {...field} className="resize-none" rows={3} /></FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="skills.leadershipExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leadership Experience</FormLabel>
                        <FormControl><Textarea {...field} className="resize-none" rows={2} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                )}
                
              </CardContent>
            </Card>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={prevStep}
                className="font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              
              {step < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="font-medium bg-primary hover:bg-primary/90 px-8"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createProfile.isPending}
                  className="font-medium bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8"
                >
                  {createProfile.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Profile"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
