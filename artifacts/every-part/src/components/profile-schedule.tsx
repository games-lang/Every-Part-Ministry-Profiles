import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  UsersRound,
  XCircle,
} from "lucide-react";
import {
  type TeamScheduleItem,
  useListProfileSchedule,
  useListTeams,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScheduleRow({
  shift,
  teamName,
}: {
  shift: TeamScheduleItem;
  teamName: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-background/60 p-4 ${
        shift.isCancelled ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <time
              dateTime={shift.scheduledDate}
              className="font-medium text-foreground"
            >
              {formatDate(shift.scheduledDate)}
            </time>
            {shift.isCancelled ? (
              <Badge
                variant="outline"
                className="border-destructive/20 text-destructive"
              >
                <XCircle className="mr-1 h-3 w-3" />
                Cancelled
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Assigned
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              <time dateTime={`${shift.scheduledDate}T${shift.startTime}`}>
                {formatTime(shift.startTime)}
                {shift.endTime ? `–${formatTime(shift.endTime)}` : ""}
              </time>
            </span>
            <span className="flex items-center gap-1.5">
              <UsersRound className="h-3.5 w-3.5" />
              {teamName}
            </span>
          </div>
        </div>
        <p className="shrink-0 font-medium text-foreground">{shift.role}</p>
      </div>
      {shift.notes && (
        <p className="mt-3 border-t border-border/50 pt-3 text-sm leading-relaxed text-muted-foreground">
          {shift.notes}
        </p>
      )}
    </div>
  );
}

export function ProfileSchedule({ profileId }: { profileId: number }) {
  const {
    data: shifts,
    isLoading,
    isError,
    refetch,
  } = useListProfileSchedule(profileId);
  const { data: teams } = useListTeams();
  const teamNames = new Map(teams?.map((team) => [team.id, team.name]) ?? []);

  return (
    <Card className="border-primary/20 shadow-sm no-print">
      <CardContent className="p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary-foreground">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium">Serving schedule</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shifts currently assigned to this profile.
            </p>
          </div>
        </div>

        {isError ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span>Schedule details could not be loaded.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="w-fit border-destructive/30 bg-background"
            >
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : shifts && shifts.length > 0 ? (
          <div className="mt-4 space-y-3">
            {shifts.map((shift) => (
              <ScheduleRow
                key={shift.id}
                shift={shift}
                teamName={teamNames.get(shift.teamId) ?? "Ministry team"}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
            <p className="text-sm text-muted-foreground">
              No shifts assigned yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Schedule a shift from the person’s team.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}