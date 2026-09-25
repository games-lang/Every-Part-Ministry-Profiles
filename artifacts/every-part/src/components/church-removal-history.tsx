import {
  getListChurchRemovalAuditQueryKey,
  useGetChurchDeletionAccess,
  useListChurchRemovalAudit,
} from "@workspace/api-client-react";
import { AlertCircle, Clock3, History } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatRemovalDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function ChurchRemovalHistory() {
  const access = useGetChurchDeletionAccess();
  const isOwner = access.data?.isOwner === true;
  const audit = useListChurchRemovalAudit({
    query: {
      enabled: isOwner,
      queryKey: getListChurchRemovalAuditQueryKey(),
    },
  });

  if (access.isLoading || access.isPending) {
    return (
      <Card className="border-border/60 shadow-sm" aria-label="Loading removal history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <History className="h-5 w-5 text-primary" />
            Removal history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (access.isError) {
    return (
      <Card className="border-destructive/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <History className="h-5 w-5 text-primary" />
            Removal history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not verify owner access, so removal history is unavailable. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) return null;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <History className="h-5 w-5 text-primary" />
          Removal history
        </CardTitle>
        <CardDescription>
          A record of people and profiles permanently removed from your church.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {audit.isLoading || audit.isPending ? (
          <div className="space-y-3" aria-label="Loading removal records">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : audit.isError ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load removal history. Please try again later.
          </p>
        ) : audit.data?.length ? (
          <ul className="divide-y rounded-lg border">
            {audit.data.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 text-sm">
                  <span className="font-medium">{entry.actorName}</span>
                  {" removed "}
                  <span className="font-medium">{entry.subjectName}</span>
                  <span className="text-muted-foreground">
                    {" "}&middot; {entry.kind === "profile" ? "Profile" : "Person"}
                  </span>
                </p>
                <time
                  dateTime={entry.removedAt}
                  className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground"
                >
                  <Clock3 className="h-4 w-4" />
                  {formatRemovalDate(entry.removedAt)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No people or profiles have been removed from this church.
          </p>
        )}
      </CardContent>
    </Card>
  );
}