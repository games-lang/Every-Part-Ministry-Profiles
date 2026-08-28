import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, Settings, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Dashboard</h1>
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
          {summary?.church.slug && (
            <Button className="font-medium bg-primary hover:bg-primary/90" asChild>
              <a href={`/profile/${summary.church.slug}`} target="_blank" rel="noopener noreferrer">
                View Public Link <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profiles</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-serif font-medium">{summary?.totalProfiles || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-border/60 shadow-sm md:col-span-2">
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
                <div className="text-lg font-medium">{summary?.church.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  Share link: everypart.com/profile/{summary?.church.slug}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Recent Profiles */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight">Recent Profiles</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profiles">View all</Link>
            </Button>
          </div>
          
          <Card className="border-border/60 shadow-sm overflow-hidden">
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
                            <span key={interest} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary-foreground border border-secondary/20">
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
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto text-muted mb-4" />
                <p>No profiles have been submitted yet.</p>
                <Button variant="link" className="mt-2 text-primary" asChild>
                  <a href={`/profile/${summary?.church.slug}`} target="_blank" rel="noopener noreferrer">
                    Fill out a test profile
                  </a>
                </Button>
              </div>
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
