import {
  useGetAppAdminAccess,
  useGetDashboardSummary,
  useGetPartFinderLeadershipProfile,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, Lightbulb, ListChecks, Users, UsersRound } from "lucide-react";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ShareProfileCard } from "@/components/share-profile-card";
import { AppFeedbackForm } from "@/components/app-feedback-form";
import { AppFeedbackInbox } from "@/pages/app-admin";
import { EarlyAccessWelcome } from "@/components/early-access-welcome";

function buildPublicProfileUrl(profilePath: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalizedPath = profilePath.startsWith("/") ? profilePath : `/${profilePath}`;
  return `${window.location.origin}${basePath}${normalizedPath}`;
}

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();
  const { data: appAdminAccess } = useGetAppAdminAccess();
  const { data: leadershipProfile } = useGetPartFinderLeadershipProfile();
  const unassignedProfileCount =
    (summary?.totalProfiles ?? 0) - (summary?.assignedProfileCount ?? 0);
  const partFinderBrief = leadershipProfile?.configured &&
    leadershipProfile.personalizationEnabled
    ? [
        leadershipProfile.priorities[0]
          ? {
              label: "Your priority",
              text: `Keep “${leadershipProfile.priorities[0]}” in view as you plan next steps.`,
              icon: Lightbulb,
            }
          : null,
        unassignedProfileCount > 0
          ? {
              label: "Follow-up opportunity",
              text: `${unassignedProfileCount} completed ${unassignedProfileCount === 1 ? "profile is" : "profiles are"} not currently assigned to a team.`,
              icon: Users,
            }
          : null,
        leadershipProfile.delegationNeeds
          ? {
              label: "Delegation focus",
              text: "You identified a responsibility you want to delegate. Ask PartFinder to help break it into possible roles.",
              icon: ListChecks,
            }
          : null,
        leadershipProfile.helpPreferences.includes("develop-leaders")
          ? {
              label: "Leadership development",
              text: "Ask PartFinder which existing profile signals may be worth exploring in a leadership conversation.",
              icon: BrainCircuit,
            }
          : null,
      ].filter(Boolean).slice(0, 4)
    : [];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          Failed to load dashboard data. Please try refreshing the page.
        </div>
      </div>
    );
  }
  if (summary?.church && !summary.church.onboardingCompletedAt) {
    return <Redirect to="/church-onboarding" />;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <EarlyAccessWelcome />
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">A pastoral overview</p>
          <h1 className="font-serif text-4xl font-semibold tracking-[-.04em]">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading your church overview..." : `Welcome back, ${summary?.church.adminName}`}
          </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Church overview metrics">
        <Card className="border-border/70 border-l-4 border-l-accent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profiles</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-serif text-4xl font-semibold tracking-[-.04em]" data-testid="metric-total-profiles">{summary?.totalProfiles || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Profiles</CardTitle>
            <UsersRound className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-serif text-4xl font-semibold tracking-[-.04em]" data-testid="metric-assigned-profiles">{summary?.assignedProfileCount || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
            <UsersRound className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-serif text-4xl font-semibold tracking-[-.04em]" data-testid="metric-active-teams">{summary?.activeTeamCount || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-primary/[0.035] shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">
              This week
            </p>
            <CardTitle className="mt-1 font-serif text-2xl">
              Your PartFinder Brief
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/leadership-profile">
              {leadershipProfile?.configured ? "Manage profile" : "Personalize"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!leadershipProfile?.configured ? (
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-primary/25 bg-background/70 p-4">
              <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Make PartFinder more useful to you</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Share your current ministry priorities and preferred coaching
                  style to receive a focused leadership brief.
                </p>
              </div>
            </div>
          ) : !leadershipProfile.personalizationEnabled ? (
            <p className="text-sm text-muted-foreground">
              Personalization is paused. Your saved leadership profile is not
              being used for this brief or PartFinder responses.
            </p>
          ) : partFinderBrief.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {partFinderBrief.map((item) => {
                if (!item) return null;
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex gap-3 rounded-xl border border-border/70 bg-background/80 p-4"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add a priority or choose how you want PartFinder to help, and
              your brief will begin taking shape here.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            PartFinder surfaces possibilities, not decisions. Consider every
            suggestion alongside prayer, pastoral wisdom, relationships, and
            each person’s own sense of calling.
          </p>
        </CardContent>
      </Card>

      {!isLoading && summary?.church.profileUrl && (
        <ShareProfileCard
          churchName={summary.church.name}
          profileUrl={buildPublicProfileUrl(summary.church.profileUrl)}
        />
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Profiles */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-medium tracking-tight">Recent Profiles</h2>
              <p className="mt-1 text-sm text-muted-foreground">The latest people ready for a pastoral conversation.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profiles">View all</Link>
            </Button>
          </div>
          
           <Card className="overflow-hidden border-border/70 shadow-sm">
            {isLoading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : summary?.recentProfiles && summary.recentProfiles.length > 0 ? (
              <div className="divide-y divide-border/60">
                {summary.recentProfiles.map(profile => (
                  <div key={profile.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <h3 className="font-medium text-foreground">{profile.memberName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Completed {new Date(profile.completedAt).toLocaleDateString()}
                      </p>
                      {profile.interests && profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.interests.slice(0, 2).map(interest => (
                            <span key={interest} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/20 text-foreground border border-secondary/20">
                              {interest}
                            </span>
                          ))}
                          {profile.interests.length > 2 && (
                            <span className="text-xs text-muted-foreground ml-1">+{profile.interests.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                      <Link href={`/profiles/${profile.id}`}>View Profile</Link>
                    </Button>
                  </div>
                ))}
              </div>
             ) : (
               <>
                 <EmptyState
                   icon={FileText}
                   title="Your first profile is still ahead"
                   description="Share the church profile link with someone who would like to reflect on how they serve and connect."
                   className="rounded-none border-0 bg-transparent"
                 />
                 <div className="-mt-10 pb-10 text-center">
                   <Button variant="link" className="text-primary" asChild>
                      <a
                        href={summary?.church.profileUrl ? buildPublicProfileUrl(summary.church.profileUrl) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                       Fill out a test profile
                     </a>
                   </Button>
                 </div>
               </>
            )}
          </Card>
        </div>

        {/* Aggregated Data */}
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-medium tracking-tight">Church signals</h2>
            <p className="mt-1 text-sm text-muted-foreground">Themes rising from completed profiles.</p>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-6 p-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Top interests</h3>
                {isLoading ? (
                  <div className="mt-3 space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                  </div>
                ) : summary?.topInterests && summary.topInterests.length > 0 ? (
                  <ul className="mt-3 space-y-2.5">
                    {summary.topInterests.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Not enough data yet.</p>
                )}
              </div>
              <div className="border-t border-border/60 pt-5">
                <h3 className="text-sm font-semibold text-foreground">Top passions</h3>
                {isLoading ? (
                  <div className="mt-3 space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                  </div>
                ) : summary?.topPassions && summary.topPassions.length > 0 ? (
                  <ul className="mt-3 space-y-2.5">
                    {summary.topPassions.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Not enough data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AppFeedbackForm sourcePage="dashboard" />

      {appAdminAccess?.isAdmin && (
        <section className="border-t border-border/70 pt-10" aria-labelledby="dashboard-feedback-heading">
          <AppFeedbackInbox />
        </section>
      )}
    </div>
  );
}
