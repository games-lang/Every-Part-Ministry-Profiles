import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProfiles, useFindVolunteerMatches, useListTeams, useListPeople, useGetChurchDeletionAccess, type MinistryPerson } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Calendar, Sparkles, AlertCircle, HeartHandshake, CheckCircle2, Info, Loader2, UsersRound, Clock3, ArrowRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useForm } from "react-hook-form";
import { EmptyState } from "@/components/empty-state";
import { PeoplePanel } from "@/components/people-panel";
import { ProfileAvatar } from "@/components/profile-photo-uploader";
import { ChurchRemovalMenu } from "@/components/church-removal-menu";

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
type DirectoryFilter = "all" | "completed" | "needs-profile";

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const isStrong = candidate.matchLevel === "Strong fit";
  const isPotential = candidate.matchLevel === "Potential fit";
  const formationLabel = isStrong
    ? "Several signals to explore"
    : isPotential
      ? "Shared signals to explore"
      : "Worth a conversation";

  const matchBadgeStyle = isStrong
    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
    : isPotential
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-muted text-muted-foreground border-border";

  return (
    <Card className="group relative overflow-hidden border-border/70 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-secondary/70 transition-colors" />
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-serif text-xl font-medium group-hover:text-primary transition-colors">{candidate.memberName}</h4>
              <Badge variant="outline" className={matchBadgeStyle}>
                 {formationLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
               <span className="flex items-center gap-2 font-medium text-foreground/70">
                 <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted-foreground/20" role="img" aria-label={`${candidate.score}% alignment`}>
                   <span className="block h-full rounded-full bg-accent" style={{ width: `${candidate.score}%` }} />
                 </span>
                  <span>{candidate.score}% shared signals</span>
               </span>
              {candidate.servingFrequency && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>Serves {candidate.servingFrequency}</span>
                </>
              )}
            </div>
          </div>
           <Link
             href={`/profiles/${candidate.id}`}
             className="inline-flex shrink-0 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
           >
             View Profile
          </Link>
        </div>

        <div className="mt-4 bg-muted/30 rounded-lg p-4 border border-border/40">
          <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-secondary" />
             Why this profile may be worth exploring
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
              <Badge key={p} variant="secondary" className="bg-secondary/20 text-foreground hover:bg-secondary/20 font-normal">
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

function PendingPeopleSection({
  people,
  canRemove,
  focusFallbackRef,
}: {
  people: MinistryPerson[];
  canRemove: boolean;
  focusFallbackRef: React.RefObject<HTMLElement | null>;
}) {
  if (people.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-medium">Needs a profile</h2>
            <Badge variant="secondary" className="bg-secondary/20 text-foreground">
              {people.length}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            People you added manually who have not completed their Ministry Profile yet.
          </p>
        </div>
        <Link
          href="/profiles?view=people"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Manage invites
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-3">
        {people.map((person) => {
          const isExpired = person.inviteStatus === "expired";
          return (
            <Card key={person.id} className="border-primary/15 bg-primary/[0.02] shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-xl font-medium">
                      {`${person.firstName} ${person.lastName}`}
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        isExpired
                          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-primary/20 bg-primary/5 text-primary"
                      }
                    >
                      <Clock3 className="mr-1 h-3.5 w-3.5" />
                      {isExpired ? "Invite expired" : "Awaiting profile"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                    {person.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {person.email}
                      </span>
                    )}
                    {person.phone && (
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden="true">•</span>
                        {person.phone}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isExpired
                      ? "Renew their invite to give them a new private link."
                      : `Invite expires ${new Date(person.inviteExpiresAt).toLocaleDateString()}.`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/profiles?view=people">View invite</Link>
                  </Button>
                  {canRemove && (
                    <ChurchRemovalMenu
                      target={{ kind: "person", id: person.id, name: `${person.firstName} ${person.lastName}` }}
                      focusFallbackRef={focusFallbackRef}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default function ProfilesList() {
  const [location] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: deletionAccess } = useGetChurchDeletionAccess();
  const canRemove = deletionAccess?.canRemove === true;
  const [activeTab, setActiveTab] = useState<"directory" | "people" | "match">(() => {
    const query = location.split("?")[1] ?? "";
    const view = new URLSearchParams(query).get("view");
    return view === "match" ? "match" : view === "people" ? "people" : "directory";
  });

  // Directory state
  const [searchTerm, setSearchTerm] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>("all");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { data: profiles, isLoading: isLoadingProfiles, error: profilesError } = useListProfiles({ search: debouncedSearch || undefined });
  const {
    data: eligibleProfiles,
    isLoading: isLoadingEligibleProfiles,
    error: eligibleProfilesError,
    refetch: refetchEligibleProfiles,
  } = useListProfiles();
  const { data: people, isLoading: isLoadingPeople, error: peopleError } = useListPeople();
  const { data: teams } = useListTeams();
  const teamNames = new Map(teams?.map((team) => [team.id, team.name]) ?? []);
  const pendingPeople = (people ?? []).filter((person) => {
    const matchesSearch =
      !debouncedSearch ||
      `${person.firstName} ${person.lastName} ${person.email ?? ""} ${person.phone ?? ""}`
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
    return person.source === "manual" && !person.profileId && person.inviteStatus !== "completed" && matchesSearch;
  });
  const showCompletedProfiles = directoryFilter !== "needs-profile";
  const showPendingPeople = directoryFilter !== "completed";

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
          <p className="text-muted-foreground mt-1 text-lg">Review member reflections and notice who may be growing into their part.</p>
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
             className={`rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "directory" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Directory
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "match"}
            onClick={() => setActiveTab("match")}
             className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "match" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-4 h-4" />
             Explore Growth
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "people"}
            onClick={() => setActiveTab("people")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "people" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <User className="h-4 w-4" />
            Add people
          </button>
        </div>
      </div>

      {activeTab === "people" ? (
        <PeoplePanel />
      ) : activeTab === "directory" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search by name, email, or skills..."
                className="pl-9 bg-card border-border/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1" role="group" aria-label="Filter profiles by completion status">
             {([
               ["all", "All"],
               ["completed", "Finished"],
               ["needs-profile", "Needs profile"],
             ] as const).map(([value, label]) => (
               <button
                 key={value}
                 type="button"
                 aria-pressed={directoryFilter === value}
                 onClick={() => setDirectoryFilter(value)}
                 className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                   directoryFilter === value
                     ? "bg-background text-foreground shadow-sm"
                     : "text-muted-foreground hover:text-foreground"
                 }`}
               >
                 {label}
               </button>
             ))}
           </div>
          </div>

          {showPendingPeople && peopleError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              People who still need a profile could not be loaded right now.
            </div>
          )}
          {showPendingPeople && isLoadingPeople ? (
            <div className="grid gap-3">
              <Card className="p-5">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="mt-3 h-4 w-80" />
              </Card>
            </div>
          ) : showPendingPeople ? (
            <PendingPeopleSection
              people={pendingPeople}
              canRemove={canRemove}
              focusFallbackRef={searchInputRef}
            />
          ) : null}

          {showCompletedProfiles && profilesError ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
              Failed to load profiles. Please try again.
            </div>
          ) : showCompletedProfiles && isLoadingProfiles ? (
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
          ) : showCompletedProfiles && profiles && profiles.length > 0 ? (
            <div className="grid gap-4">
               {profiles.map((profile) => (
                 <Card key={profile.id} className="group relative overflow-hidden border-border/70 transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-secondary/70 transition-colors" />
                   <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-6">
                     <Link href={`/profiles/${profile.id}`} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                       <div className="flex items-start gap-4 md:items-center">
                       <ProfileAvatar name={profile.memberName} photoUrl={profile.profilePhotoUrl} />

                       <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-xl font-medium group-hover:text-primary transition-colors">
                            {profile.memberName}
                          </h3>
                           <span className="rounded-md bg-secondary/20 px-2.5 py-1 text-xs font-semibold text-foreground md:hidden">
                             View
                           </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          {profile.profileType !== 'adult' && (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize">
                              {profile.profileType} {profile.age ? `(Age ${profile.age})` : ''}
                            </Badge>
                          )}
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
                          {profile.teamId && teamNames.get(profile.teamId) && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                              <UsersRound className="mr-1 h-3 w-3" />
                              {teamNames.get(profile.teamId)}
                            </Badge>
                          )}
                          {profile.passions && profile.passions.slice(0, 2).map((passion) => (
                            <Badge key={passion} variant="secondary" className="bg-secondary/20 text-foreground hover:bg-secondary/20 font-normal">
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
                       </div>
                     </Link>
                     <div className="hidden shrink-0 md:block">
                       <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                         <Link href={`/profiles/${profile.id}`}>View Profile</Link>
                       </Button>
                     </div>
                      {canRemove && (
                        <ChurchRemovalMenu
                          target={{ kind: "profile", id: profile.id, name: profile.memberName }}
                          focusFallbackRef={searchInputRef}
                        />
                      )}
                   </div>
                </Card>
              ))}
            </div>
          ) : showCompletedProfiles ? (
             <EmptyState
               icon={User}
                title={
                  directoryFilter === "completed"
                    ? searchTerm
                      ? "No finished profiles match that search"
                      : "No finished profiles yet"
                    : searchTerm
                      ? "No completed profiles match that search"
                      : pendingPeople.length > 0
                        ? "No completed profiles yet"
                        : "No profiles yet"
                }
                description={
                  directoryFilter === "completed"
                    ? searchTerm
                      ? "Try a name, email, or skill with a little more room."
                      : "Completed Ministry Profiles will appear here once people finish their reflection."
                    : searchTerm
                      ? pendingPeople.length > 0
                        ? "People who still need a profile are listed above. Try a name, email, or skill to find completed profiles."
                        : "Try a name, email, or skill with a little more room."
                      : pendingPeople.length > 0
                        ? "People who still need a profile are listed above. Completed Ministry Profiles will appear here once people finish their reflection."
                        : "Share your church profile link to invite the first person into a thoughtful reflection."
                }
               actionLabel={searchTerm ? "Clear search" : undefined}
               onAction={searchTerm ? () => setSearchTerm("") : undefined}
             />
          ) : !isLoadingPeople && !peopleError && pendingPeople.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={searchTerm ? "No people need a profile matching that search" : "Everyone has finished their profile"}
              description={
                searchTerm
                  ? "Try a different name, email, or phone number."
                  : "People added manually will appear here until they complete their Ministry Profile."
              }
              actionLabel={searchTerm ? "Clear search" : undefined}
              onAction={searchTerm ? () => setSearchTerm("") : undefined}
            />
          ) : null}
        </div>
      ) : isLoadingEligibleProfiles ? (
        <Skeleton className="h-64 w-full" />
      ) : eligibleProfilesError ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load completed profiles"
          description="Please try again before exploring growth guidance."
          actionLabel="Try again"
          onAction={() => void refetchEligibleProfiles()}
        />
      ) : !eligibleProfiles?.some((profile) => profile.profileType === "adult") ? (
        <EmptyState
          icon={HeartHandshake}
          title="Growth guidance isn't ready yet"
          description="There's not enough profile data yet for guidance — once a few profiles are completed, suggestions will appear here."
        />
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border/60 shadow-sm sticky top-6">
              <CardHeader className="bg-muted/30 pb-5 border-b border-border/50">
                <CardTitle className="font-serif text-xl flex items-center gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-primary" />
                   Explore a Growth Opportunity
                </CardTitle>
                <CardDescription className="leading-relaxed mt-2 text-sm">
                    Describe a ministry need or area of growth, and we’ll surface profile signals worth exploring with a person—not a placement.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmitMatch)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Growth Opportunity <span className="text-destructive">*</span></label>
                    <Textarea
                      className={`flex min-h-[120px] w-full rounded-md border ${errors.roleDescription ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-ring'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                       placeholder="e.g., We’re discerning how to nurture a warm, welcoming presence in Sunday hospitality. What gifts, experience, and next steps might be worth exploring in conversation?"
                      {...register("roleDescription", {
                           required: "Describe the growth opportunity.",
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
                    <label className="block text-sm font-medium text-foreground mb-1.5">Helpful Context <span className="text-muted-foreground font-normal">(Optional)</span></label>
                    <Textarea
                      className={`flex min-h-[80px] w-full rounded-md border ${errors.preferredExperience ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-ring'} bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                       placeholder="e.g., Past experience, current season, or context that would help a pastor begin the conversation."
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
                    <label className="block text-sm font-medium text-foreground mb-2.5">Current Capacity or Rhythms <span className="text-muted-foreground font-normal">(Optional)</span></label>
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
                         Exploring growth signals...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 text-secondary" />
                         Explore Growth Signals
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
                 <h3 className="font-serif text-xl font-medium text-destructive mb-2">Couldn’t surface growth signals</h3>
                 <p className="text-destructive/80 text-sm">Try adjusting the growth opportunity and submitting again.</p>
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
                         <h3 className="font-serif text-xl font-medium text-foreground">Formation Summary</h3>
                      <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{matchMutation.data.summary}</p>

                      <div className="flex items-center gap-2 mt-5 text-xs font-medium text-muted-foreground/80 bg-muted/50 inline-flex px-3 py-1.5 rounded-md">
                        {matchMutation.data.usedAi ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                             Relevant, privacy-minimized profile reflections were compared as conversation signals.
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                             A profile-overlap view was used because guidance was unavailable.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 pb-2 border-b border-border/50">
                   <h3 className="font-serif text-2xl font-medium">Profiles Worth Exploring</h3>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                     {`${matchMutation.data.candidates.length} ${matchMutation.data.candidates.length === 1 ? "signal" : "signals"}`}
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
                      <p className="font-serif text-xl font-medium text-foreground">No clear signals surfaced yet</p>
                      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Try broadening the growth opportunity or making helpful context optional.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border/50 rounded-xl p-10 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                  <Sparkles className="w-10 h-10 text-primary/40" />
                </div>
                   <h3 className="font-serif text-2xl font-medium text-foreground mb-3">Notice Who May Be Growing Into Their Part</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
                     Describe a growth opportunity on the left. The system will surface relevant profile signals to support a thoughtful pastoral conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
