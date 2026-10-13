import { Link } from "wouter";
import { getListTeamsQueryKey, useListTeams } from "@workspace/api-client-react";
import { UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProfileTeams({ teamId }: { teamId: number | null }) {
  const teams = useListTeams({
    query: {
      queryKey: getListTeamsQueryKey(),
      enabled: teamId !== null,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    },
  });
  const team = teams.data?.find((item) => item.id === teamId);
  return (
    <Card className="no-print" data-testid="profile-teams">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <UsersRound className="h-5 w-5" />Teams
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teamId === null ? (
          <p className="text-sm text-muted-foreground">No current team assignment.</p>
        ) : teams.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">Loading team membership…</p>
        ) : teams.isError ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <p role="alert">Unable to load team membership.</p>
            <Button variant="outline" size="sm" onClick={() => void teams.refetch()}>Retry</Button>
          </div>
        ) : team ? (
          <ul>
            <li className="flex flex-wrap items-center gap-3">
              <Link href={`/teams#team-${team.id}`} className="font-semibold text-primary underline underline-offset-4" data-testid="link-profile-team">
                {team.name}
              </Link>
              {team.isArchived && <Badge variant="outline">Archived</Badge>}
              <span className="text-xs text-muted-foreground">Current team</span>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Team membership is unavailable. <Link href="/teams" className="text-primary underline">View teams</Link></p>
        )}
      </CardContent>
    </Card>
  );
}
