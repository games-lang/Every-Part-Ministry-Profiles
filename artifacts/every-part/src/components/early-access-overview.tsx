import { useGetEarlyAccessOverview } from "@workspace/api-client-react";
import { Activity, BarChart3, Church, Clock3, MessageSquareText, UsersRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
    : "No activity recorded";
}

function healthLabel(value: string) {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function EarlyAccessOverview() {
  const { data, isLoading, error } = useGetEarlyAccessOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Early Access overview unavailable</CardTitle>
          <CardDescription>Aggregate usage data could not be loaded right now.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = [
    { label: "Early Access churches", value: data.totalEarlyAccessChurches, icon: Church },
    { label: "Active in 30 days", value: data.activeChurches, icon: Activity },
    { label: "Inactive 7+ days", value: data.inactiveSevenDays, icon: Clock3 },
    { label: "Profiles completed", value: data.profilesCompleted, icon: UsersRound },
    { label: "PartFinder conversations", value: data.partFinderConversations, icon: MessageSquareText },
    { label: "PartFinder searches", value: data.partFinderSearches, icon: MessageSquareText },
    { label: "Opportunities created", value: data.opportunitiesCreated, icon: BarChart3 },
  ];

  return (
    <div className="space-y-8" id="early-access-overview">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">EveryPart CEO</p>
        <h2 className="font-serif text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Early Access Overview</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A simple view of whether participating churches are using Every Part
          and where they may be getting stuck. Only aggregate counts appear here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/70 border-l-4 border-l-secondary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="font-serif text-4xl font-semibold" data-testid={`metric-early-access-${label.toLowerCase().replaceAll(" ", "-")}`}>
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-border/70 border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-2"><CardDescription>Average completion rate</CardDescription></CardHeader>
          <CardContent><p className="font-serif text-4xl font-semibold">{data.averageCompletionRate}%</p></CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Church health</CardTitle>
          <CardDescription>Simple activity labels, not predictive scores.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[.12em] text-muted-foreground">
              <tr>
                <th className="pb-3 pr-4 font-semibold">Church</th>
                <th className="pb-3 pr-4 font-semibold">Early Access since</th>
                <th className="pb-3 pr-4 font-semibold">Invited</th>
                <th className="pb-3 pr-4 font-semibold">Completed</th>
                <th className="pb-3 pr-4 font-semibold">PartFinder</th>
                <th className="pb-3 pr-4 font-semibold">Last activity</th>
                <th className="pb-3 font-semibold">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.churches.map((church) => (
                <tr key={church.id}>
                  <td className="py-4 pr-4 font-semibold text-foreground">{church.name}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{formatDate(church.earlyAccessStartDate)}</td>
                  <td className="py-4 pr-4">{church.membersInvited}</td>
                  <td className="py-4 pr-4">{church.profilesCompleted} ({church.completionRate}%)</td>
                  <td className="py-4 pr-4">{church.partFinderConversations}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{formatDate(church.lastActivityAt)}</td>
                  <td className="py-4 font-medium text-primary">{healthLabel(church.health)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.churches.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No Early Access churches yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}