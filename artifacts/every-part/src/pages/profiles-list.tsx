import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProfiles, useFindVolunteerMatches } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Calendar, Sparkles, AlertCircle, HeartHandshake, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useForm } from "react-hook-form";

const AVAILABILITY_OPTIONS = [
  "Sunday mornings",
  "Sunday evenings",
  "Weekday mornings",
  "Weekday evenings",
  "Saturdays",
  "Flexible/varies",
];

type MatchFormValues = {
  roleDescription: string;
  ministryArea?: string;
  preferredExperience?: string;
  availability?: string[];
};

type MatchResponse = NonNullable<ReturnType<typeof useFindVolunteerMatches>["data"]>;
type Candidate = MatchResponse["candidates"][number];

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const isStrong = candidate.matchLevel === "Strong fit";
  const isPotential = candidate.matchLevel === "Potential fit";

  const matchBadgeStyle = isStrong
    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
    : isPotential
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-muted text-muted-foreground border-border";

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-all shadow-sm hover:shadow-md group relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-secondary/70 transition-colors" />
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-serif text-xl font-medium group-hover:text-primary transition-colors">{candidate.memberName}</h4>
              <Badge variant="outline" className={matchBadgeStyle}>
                {candidate.matchLevel}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span className="font-medium bg-muted px-2 py-0.5 rounded text-foreground/70">{candidate.score}% alignment</span>
              {candidate.servingFrequency && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>Serves {candidate.servingFrequency}</span>
                </>
              )}
            </div>
          </div>
          <Link href={`/profiles/${candidate.id}`}>
            <Button variant="outline" size="sm" className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              View Profile
            </Button>
          </Link>
        </div>

        <div className="mt-4 bg-muted/30 rounded-lg p-4 border border-border/40">
          <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-secondary" />
            Why they might be a fit
          </p>
          <ul className="space-y-2">
            {candidate.reasons.map((reason, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                <span className="text-secondary/60 mt-0.5">•</span>
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {(candidate.passions.length > 0 || candidate.interests.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
            {candidate.passions.map(p => (
              <Badge key={p} variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 font-normal">
                {p}
              </Badge>
            ))}
            {candidate.interests.map(i => (
              <Badge key={i} variant="outline" className="bg-background font-normal">
                {i}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ProfilesList() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<"directory" | "match">(() => {
    const query = location.split("?")[1] ?? "";
    return new URLSearchParams(query).get("view") === "match" ? "match" : "directory";
  });

  // Directory state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { data: profiles, isLoading: isLoadingProfiles, error: profilesError } = useListProfiles({ search: debouncedSearch || undefined });

  // Match state
  const matchMutation = useFindVolunteerMatches();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<MatchFormValues>({
    defaultValues: {
      roleDescription: "",
      ministryArea: "",
      preferredExperience: "",
      availability: [],
    }
  });

  const selectedAvailability = watch("availability") || [];

  const onSubmitMatch = (data: MatchFormValues) => {
    matchMutation.mutate({ data });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Ministry Profiles</h1>
          <p className="text-muted-foreground mt-1 text-lg">Review member assessments and discover volunteers.</p>
        </div>
        <div
          className="flex space-x-1 bg-muted/50 p-1 rounded-lg border border-border/50 self-start sm:self-auto"
          role="tablist"
          aria-label="Profiles views"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "directory"}
            onClick={() => setActiveTab("directory")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "directory" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Directory
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "match"}
            onClick={() => setActiveTab("match")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${activeTab === "match" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-4 h-4" />
            Find Matches
          </button>
        </div>
      </div>

      {activeTab === "directory" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, or skills..."
                className="pl-9 bg-card border-border/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {profilesError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
              Failed to load profiles. Please try again.
            </div>
          ) : isLoadingProfiles ? (
            <div className="grid gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id} className="overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-secondary/70 transition-colors" />
                  <Link href={`/profiles/${profile.id}`} className="block p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-xl font-medium group-hover:text-primary transition-colors">
                            {profile.memberName}
                          </h3>
                          <div className="md:hidden">
                            <Button variant="secondary" size="sm">View</Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {profile.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(profile.completedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-3">
                          {profile.passions && profile.passions.slice(0, 2).map((passion) => (
                            <Badge key={passion} variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 font-normal">
                              {passion}
                            </Badge>
                          ))}
                          {profile.interests && profile.interests.slice(0, 2).map((interest) => (
                            <Badge key={interest} variant="outline" className="bg-background font-normal">
                              {interest}
                            </Badge>
                          ))}
                          {((profile.passions?.length || 0) > 2 || (profile.interests?.length || 0) > 2) && (
                            <Badge variant="outline" className="text-muted-foreground border-dashed font-normal">
                              +{Math.max(0, (profile.passions?.length || 0) - 2) + Math.max(0, (profile.interests?.length || 0) - 2)} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:block shrink-0">
                        <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-border/60">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-xl font-medium mb-2">No profiles found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Share your church assessment link to get started."}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-6">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border/60 shadow-sm sticky top-6">
              <CardHeader className="bg-muted/30 pb-5 border-b border-border/50">
                <CardTitle className="font-serif text-xl flex items-center gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-primary" />
                  Describe the Need
                </CardTitle>
                <CardDescription className="leading-relaxed mt-2 text-sm">
                   Share what you're looking for, and we'll carefully suggest members whose gifts and passions may align with this role.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmitMatch)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Role Description <span className="text-destructive">*</span></label>
                    <Textarea
                      className={`flex min-h-[120px] w-full rounded-md border ${errors.roleDescription ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-ring'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                      placeholder="e.g., We need a warm, welcoming presence to coordinate the Sunday morning hospitality team. This involves scheduling volunteers, ensuring coffee is ready, and greeting newcomers."
                      {...register("roleDescription", {
                        required: "Describe the ministry need.",
                        minLength: {
                          value: 20,
                          message: "Please provide at least 20 characters.",
                        },
                        maxLength: {
                          value: 2000,
                          message: "Keep the role description under 2,000 characters.",
                        },
                      })}
                    />
                    {errors.roleDescription && (
                      <p className="text-xs text-destructive mt-1.5">{errors.roleDescription.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Ministry Area <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <Input
                      placeholder="e.g., Hospitality, Youth, Worship"
                      className={errors.ministryArea ? 'border-destructive' : ''}
                      {...register("ministryArea", {
                        maxLength: {
                          value: 120,
                          message: "Keep the ministry area under 120 characters.",
                        },
                      })}
                    />
                    {errors.ministryArea && (
                      <p className="text-xs text-destructive mt-1.5">{errors.ministryArea.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Preferred Experience <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <Textarea
                      className={`flex min-h-[80px] w-full rounded-md border ${errors.preferredExperience ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-ring'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                      placeholder="e.g., Has led a team before, comfortable with basic scheduling software."
                      {...register("preferredExperience", {
                        maxLength: {
                          value: 500,
                          message: "Keep preferred experience under 500 characters.",
                        },
                      })}
                    />
                    {errors.preferredExperience && (
                      <p className="text-xs text-destructive mt-1.5">{errors.preferredExperience.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2.5">Availability Needed <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_OPTIONS.map(option => {
                        const isSelected = selectedAvailability.includes(option);
                        return (
                          <button
                            type="button"
                            key={option}
                            aria-pressed={isSelected}
                            className={`rounded-full border px-3 py-1 text-xs transition-all ${isSelected ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            onClick={() => {
                              const updated = isSelected
                                ? selectedAvailability.filter(c => c !== option)
                                : [...selectedAvailability, option];
                              setValue("availability", updated, { shouldDirty: true });
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2 py-6 text-base shadow-sm"
                    disabled={matchMutation.isPending}
                  >
                    {matchMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Finding matches...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 text-secondary" />
                        Find Volunteer Matches
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            {matchMutation.isPending ? (
              <div className="space-y-6">
                <Skeleton className="h-[140px] w-full rounded-xl" />
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-6 w-48" />
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-6">
                      <div className="flex justify-between mb-4">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                      <div className="space-y-3 mt-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : matchMutation.isError ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-10 text-center mt-6">
                <AlertCircle className="w-12 h-12 text-destructive/60 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-medium text-destructive mb-2">Failed to find matches</h3>
                <p className="text-destructive/80 text-sm">Please try adjusting your criteria and submitting again.</p>
              </div>
            ) : matchMutation.data ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {matchMutation.data.advisory && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex gap-4 shadow-sm">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary">Pastoral Advisory</h4>
                      <p className="text-primary/80 text-sm mt-1.5 leading-relaxed">
                        {matchMutation.data.advisory}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary/80"></div>
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-serif text-xl font-medium text-foreground">Matching Summary</h3>
                      <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{matchMutation.data.summary}</p>

                      <div className="flex items-center gap-2 mt-5 text-xs font-medium text-muted-foreground/80 bg-muted/50 inline-flex px-3 py-1.5 rounded-md">
                        {matchMutation.data.usedAi ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                            AI compared the role with relevant, privacy-minimized profile reflections.
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            A profile-overlap fallback was used because AI was unavailable.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 pb-2 border-b border-border/50">
                  <h3 className="font-serif text-2xl font-medium">Suggested Candidates</h3>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {matchMutation.data.candidates.length} {matchMutation.data.candidates.length === 1 ? 'match' : 'matches'}
                  </Badge>
                </div>

                {matchMutation.data.candidates.length > 0 ? (
                  <div className="grid gap-5">
                    {matchMutation.data.candidates.map(candidate => (
                       <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-card rounded-xl border border-border/60 shadow-sm">
                     <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                     <p className="font-serif text-xl font-medium text-foreground">No strong matches found</p>
                     <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Try broadening your role description or making experience optional.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border/50 rounded-xl p-10 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                  <Sparkles className="w-10 h-10 text-primary/40" />
                </div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-3">Discover Potential Volunteers</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
                    Describe the ministry need on the left. The system will compare relevant profile reflections to suggest people for a thoughtful pastoral conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
