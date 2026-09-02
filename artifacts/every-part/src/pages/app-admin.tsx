import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import {
  getGetAppFeedbackQueryKey,
  useGetAppAdminAccess,
  useGetAppFeedback,
  useUpdateAppFeedback,
  type AppFeedback,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Inbox,
  Mail,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions: Array<{ value: AppFeedback["status"]; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: AppFeedback["status"]) {
  if (status === "resolved") return "border-accent/30 bg-accent/10 text-accent";
  if (status === "dismissed") return "border-muted-foreground/20 bg-muted text-muted-foreground";
  if (status === "reviewing") return "border-secondary/40 bg-secondary/15 text-foreground";
  return "border-primary/20 bg-primary/10 text-primary";
}

function FeedbackCard({
  item,
  onSaved,
}: {
  item: AppFeedback;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<AppFeedback["status"]>(item.status);
  const [response, setResponse] = useState(item.adminResponse ?? "");
  const updateFeedback = useUpdateAppFeedback();
  const responseText = response.trim();
  const replyHref = item.contactEmail && responseText
    ? `mailto:${item.contactEmail}?subject=${encodeURIComponent(
        item.type === "fix" ? "Following up on your Every Part report" : "Following up on your Every Part suggestion",
      )}&body=${encodeURIComponent(responseText)}`
    : undefined;

  return (
    <Card className="border-border/70 shadow-sm" data-testid={`card-admin-feedback-${item.id}`}>
      <CardHeader className="gap-4 border-b border-border/60 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            item.type === "fix" ? "bg-secondary/20 text-foreground" : "bg-accent/10 text-accent"
          }`}>
            {item.type === "fix" ? <CircleAlert className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">
                {item.type === "fix" ? "Problem to fix" : "Suggestion"}
              </CardTitle>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(item.status)}`} data-testid={`status-feedback-${item.id}`}>
                {statusOptions.find((option) => option.value === item.status)?.label}
              </span>
            </div>
            <CardDescription className="mt-1">
              {formatDate(item.createdAt)} · From {item.sourcePage}
            </CardDescription>
          </div>
        </div>
        {item.contactEmail ? (
          <a
            href={`mailto:${item.contactEmail}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            data-testid={`link-feedback-email-${item.id}`}
          >
            <Mail className="h-4 w-4" />
            {item.contactEmail}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">No reply email provided</span>
        )}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="rounded-2xl bg-muted/60 p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground" data-testid={`text-feedback-message-${item.id}`}>
            {item.message}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-start">
          <div>
            <label htmlFor={`feedback-status-${item.id}`} className="text-sm font-semibold text-foreground">
              Status
            </label>
            <select
              id={`feedback-status-${item.id}`}
              value={status}
              onChange={(event) => setStatus(event.target.value as AppFeedback["status"])}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-testid={`select-feedback-status-${item.id}`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`feedback-response-${item.id}`} className="text-sm font-semibold text-foreground">
              Response or internal note
            </label>
            <textarea
              id={`feedback-response-${item.id}`}
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Record what you would like the team to remember or share with the person."
              rows={3}
              maxLength={5000}
              className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-testid={`textarea-feedback-response-${item.id}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground" data-testid={`text-feedback-updated-${item.id}`}>
            {item.respondedAt ? `Last response ${formatDate(item.respondedAt)}` : "Not responded yet"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {replyHref && (
              <a
                href={replyHref}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
                data-testid={`link-reply-feedback-${item.id}`}
              >
                <Mail className="h-4 w-4" />
                Open reply draft
              </a>
            )}
            <Button
              type="button"
              onClick={() => updateFeedback.mutate(
                { id: item.id, data: { status, adminResponse: responseText || null } },
                { onSuccess: onSaved },
              )}
              disabled={updateFeedback.isPending}
              className="rounded-full"
              data-testid={`button-save-feedback-${item.id}`}
            >
              {updateFeedback.isPending ? "Saving…" : "Save update"}
            </Button>
          </div>
        </div>
        {updateFeedback.isError && (
          <p className="text-sm text-destructive" role="alert" data-testid={`status-feedback-error-${item.id}`}>
            We couldn’t save this update. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AccessDenied() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const currentUserId = user?.id;

  const copyUserId = async () => {
    if (!currentUserId) return;
    await navigator.clipboard.writeText(currentUserId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg border-border/70 shadow-sm">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/20 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="font-serif text-3xl">EveryPart CEO access required</CardTitle>
          <CardDescription className="leading-6">
            This area is reserved for the EveryPart CEO. Your account is signed in, but it is not currently on the EveryPart CEO allowlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUserId && (
            <div className="mb-5 rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Signed-in Clerk user ID</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-background px-3 py-2 text-xs text-foreground">{currentUserId}</code>
                <Button type="button" variant="outline" size="sm" onClick={() => void copyUserId()} className="shrink-0 rounded-full">
                  {copied ? "Copied" : "Copy ID"}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                 Add this exact ID to the secure <span className="font-medium text-foreground">EVERY_PART_APP_ADMIN_USER_IDS</span> secret, then refresh the app.
              </p>
            </div>
          )}
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/dashboard">Return to church dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AppFeedbackInbox() {
  const [statusFilter, setStatusFilter] = useState<"all" | AppFeedback["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | AppFeedback["type"]>("all");
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useGetAppFeedback();
  const items = data?.items ?? [];

  const filteredItems = useMemo(
    () => items.filter((item) =>
      (statusFilter === "all" || item.status === statusFilter) &&
      (typeFilter === "all" || item.type === typeFilter),
    ),
    [items, statusFilter, typeFilter],
  );
  const openCount = items.filter((item) => item.status === "new" || item.status === "reviewing").length;
  const suggestionCount = items.filter((item) => item.type === "suggestion").length;
  const fixCount = items.filter((item) => item.type === "fix").length;

  const onSaved = () => {
    void queryClient.invalidateQueries({ queryKey: getGetAppFeedbackQueryKey() });
  };

  return (
    <div className="space-y-8" id="feedback">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
              <ShieldCheck className="h-4 w-4" />
              EveryPart CEO
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Suggestions & improvements</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Listen to what people are noticing, respond thoughtfully, and keep a clear record of improvements.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-full"
            data-testid="button-refresh-admin-feedback"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3" aria-label="Feedback overview metrics">
          <Card className="border-border/70 border-l-4 border-l-primary shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Open items</CardDescription>
              <CardTitle className="font-serif text-4xl" data-testid="metric-open-feedback">{openCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/70 border-l-4 border-l-accent shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Suggestions</CardDescription>
              <CardTitle className="font-serif text-4xl" data-testid="metric-suggestions">{suggestionCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/70 border-l-4 border-l-secondary shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Problems to fix</CardDescription>
              <CardTitle className="font-serif text-4xl" data-testid="metric-fixes">{fixCount}</CardTitle>
            </CardHeader>
          </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Feedback inbox</p>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredItems.length} of {items.length} {items.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as "all" | AppFeedback["type"])}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                data-testid="select-admin-feedback-type-filter"
              >
                <option value="all">All types</option>
                <option value="suggestion">Suggestions</option>
                <option value="fix">Problems to fix</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | AppFeedback["status"])}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                data-testid="select-admin-feedback-status-filter"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
      </Card>

      {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <Card key={item} className="border-border/70 p-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-5 h-24 w-full" />
                <Skeleton className="mt-5 h-10 w-full" />
              </Card>
            ))}
          </div>
      ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Feedback could not be loaded</CardTitle>
              <CardDescription>
                 Confirm that your account is configured as the EveryPart CEO, then try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => void refetch()} className="rounded-full">
                Try again
              </Button>
            </CardContent>
          </Card>
      ) : filteredItems.length === 0 ? (
          <Card className="border-dashed border-border/80">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-accent" />
              <h2 className="mt-4 font-serif text-2xl font-semibold">Nothing here yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                 New suggestions and problem reports submitted from the dashboard or sign-in page will appear in this inbox.
              </p>
            </CardContent>
          </Card>
      ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <FeedbackCard key={item.id} item={item} onSaved={onSaved} />
            ))}
          </div>
      )}
    </div>
  );
}

export function AppAdminRoute() {
  const { data: access, isLoading, error } = useGetAppAdminAccess();

  useEffect(() => {
    try {
      window.sessionStorage.removeItem("every-part:admin-return");
    } catch {
      // Nothing else is needed if session storage is unavailable.
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking EveryPart CEO access…</p>
      </div>
    );
  }

  if (error || !access?.isAdmin) return <AccessDenied />;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/80 bg-background/95">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="rounded-xl" aria-label="Every Part church dashboard">
            <Brand compact />
          </Link>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Church dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <AppFeedbackInbox />
      </main>
    </div>
  );
}