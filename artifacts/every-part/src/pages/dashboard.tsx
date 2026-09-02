import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, Settings, Sparkles, Users, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ShareProfileCard } from "@/components/share-profile-card";

function buildPublicProfileUrl(profilePath: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalizedPath = profilePath.startsWith("/") ? profilePath : `/${profilePath}`;
  return `${window.location.origin}${basePath}${normalizedPath}`;
}

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          Failed to load dashboard data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-9 px-4 py-8 sm:py-10">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">A pastoral overview</p>
          <h1 className="font-serif text-4xl font-semibold tracking-[-.04em]">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading your church overview..." : `Welcome back, ${summary?.church.adminName}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-medium" asChild>
            <Link href="/church-setup">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
           {summary?.church.profileUrl && (
            <Button className="font-medium bg-primary hover:bg-primary/90" asChild>
               <a href={buildPublicProfileUrl(summary.church.profileUrl)} target="_blank" rel="noopener noreferrer">
                View Public Link <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4" aria-label="Church overview metrics">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
            <UsersRound className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-2">
                <div className="font-serif text-4xl font-semibold tracking-[-.04em]" data-testid="metric-active-teams">{summary?.activeTeamCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.assignedProfileCount || 0} profiles assigned
                </p>
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="/teams">Manage teams</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-border/70 bg-card shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Church Details</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div>
                 <div className="font-serif text-2xl font-medium">{summary?.church.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                   Share link: {summary?.church.profileUrl
                     ? buildPublicProfileUrl(summary.church.profileUrl)
                     : "Preparing your link..."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       {!isLoading && summary?.church.profileUrl && (
         <ShareProfileCard
           churchName={summary.church.name}
           profileUrl={buildPublicProfileUrl(summary.church.profileUrl)}
         />
       )}

      <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-md">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
           <div className="flex items-start gap-4">
             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
               <Sparkles className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl text-primary-foreground">
                Find volunteers for a ministry need
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-2xl leading-relaxed text-primary-foreground/75">
                Describe a role and explore members whose gifts, passions, and availability may align.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full shrink-0 font-medium sm:w-auto"
            asChild
          >
            <Link href="/profiles?view=match">
              Find Volunteers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Recent Profiles */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">Recent Profiles</h2>
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
          <h2 className="font-serif text-xl font-medium tracking-tight">Top Interests</h2>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : summary?.topInterests && summary.topInterests.length > 0 ? (
                <ul className="divide-y divide-border/60">
                  {summary.topInterests.map((item, i) => (
                    <li key={i} className="p-4 flex items-center justify-between">
                      <span className="font-medium text-sm">{item.label}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Not enough data to show trends.
                </div>
              )}
            </CardContent>
          </Card>

          <h2 className="font-serif text-xl font-medium tracking-tight mt-8">Top Passions</h2>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : summary?.topPassions && summary.topPassions.length > 0 ? (
                <ul className="divide-y divide-border/60">
                  {summary.topPassions.map((item, i) => (
                    <li key={i} className="p-4 flex items-center justify-between">
                      <span className="font-medium text-sm">{item.label}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Not enough data to show trends.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
