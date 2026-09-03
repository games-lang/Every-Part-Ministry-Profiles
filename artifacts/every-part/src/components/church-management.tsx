import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminChurchQueryKey,
  getGetAdminChurchesQueryKey,
  useGetAdminChurch,
  useGetAdminChurches,
  useUpdateAdminChurch,
  type AdminChurchDetail,
  type AdminChurchSummary,
  type AdminChurchUpdateInput,
  type GetAdminChurchesParams,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type EarlyAccessFilter = "all" | AdminChurchSummary["earlyAccessStatus"];
type BillingFilter = "all" | AdminChurchSummary["billingPlan"];

type EditForm = {
  name: string;
  address: string;
  website: string;
  adminName: string;
  adminEmail: string;
  earlyAccessStatus: AdminChurchSummary["earlyAccessStatus"];
  foundingChurch: boolean;
};

const billingPlans: Array<{ value: BillingFilter; label: string }> = [
  { value: "all", label: "All plans" },
  { value: "starter", label: "Starter" },
  { value: "growing", label: "Growing" },
  { value: "complete", label: "Complete" },
  { value: "network", label: "Network" },
  { value: "unlimited", label: "Unlimited" },
];

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" },
  ).format(date);
}

function relativeDate(value: string | null | undefined) {
  if (!value) return "No activity recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity recorded";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFormValues(church: AdminChurchSummary): EditForm {
  return {
    name: church.name,
    address: church.address ?? "",
    website: church.website ?? "",
    adminName: church.adminName,
    adminEmail: church.adminEmail,
    earlyAccessStatus: church.earlyAccessStatus,
    foundingChurch: church.foundingChurch,
  };
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "teal" | "gold" | "neutral" | "danger";
}) {
  const tones = {
    teal: "border-accent/30 bg-accent/10 text-accent",
    gold: "border-secondary/45 bg-secondary/15 text-foreground",
    neutral: "border-border bg-muted/65 text-muted-foreground",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.1em] ${tones[tone]}`}>{children}</span>;
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string | number;
  detail?: string;
  tone: "teal" | "gold" | "navy" | "coral";
}) {
  const colors = {
    teal: "bg-accent/10 text-accent",
    gold: "bg-secondary/20 text-foreground",
    navy: "bg-primary/10 text-primary",
    coral: "bg-orange-100 text-orange-800",
  };
  return (
    <div className="rounded-2xl border border-border/70 bg-background/65 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-4 w-4" /></span>
        {detail && <span className="text-right text-[11px] leading-4 text-muted-foreground">{detail}</span>}
      </div>
      <p className="mt-4 font-serif text-3xl font-semibold tracking-[-.04em] text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[.11em] text-muted-foreground">{label}</p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} data-testid={`input-${id}`} />
    </div>
  );
}

function ChurchListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="rounded-2xl border border-border/60 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/2" />
          <Skeleton className="mt-3 h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptySelection() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-secondary/20 text-primary">
        <Building2 className="h-7 w-7" />
      </span>
      <h2 className="mt-6 font-serif text-2xl font-semibold tracking-tight">Choose a church to begin</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Select a participating church from the care list to review its aggregate health and administrator access.</p>
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="space-y-6 p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1"><Skeleton className="h-7 w-64" /><Skeleton className="mt-3 h-4 w-40" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}</div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

function ChurchDetail({
  detail,
  onEdit,
  onRefresh,
  isRefreshing,
}: {
  detail: AdminChurchDetail;
  onEdit: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const church = detail.church;
  const publicProfileHref = `/profile/${church.slug}`;
  return (
    <div className="space-y-6 p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-primary text-xl font-semibold tracking-tight text-primary-foreground shadow-sm">{initials(church.name)}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-serif text-3xl font-semibold tracking-[-.045em]">{church.name}</h2>
              {church.foundingChurch && <StatusPill tone="gold"><Star className="h-3 w-3 fill-current" /> Founding church</StatusPill>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">/{church.slug} · Joined {formatDate(church.createdAt)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill tone={church.earlyAccessStatus === "early_access" ? "teal" : "neutral"}>
                {church.earlyAccessStatus === "early_access" && <Sparkles className="h-3 w-3" />}
                {church.earlyAccessStatus === "early_access" ? "Early Access" : "Standard"}
              </StatusPill>
              <StatusPill tone="neutral">{labelize(church.billingPlan)} plan</StatusPill>
              <span className="text-xs text-muted-foreground">Billing {labelize(church.billingStatus)}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} className="rounded-full" data-testid="button-refresh-church-detail">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={onEdit} className="rounded-full" data-testid={`button-edit-church-${church.id}`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit fields
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="Active people" value={church.activePeopleCount} detail="aggregate only" tone="teal" />
        <Metric icon={CheckCircle2} label="Profiles complete" value={church.completedProfileCount} detail="completed" tone="gold" />
        <Metric icon={ShieldCheck} label="Administrators" value={church.adminCount} detail="access seats" tone="navy" />
        <Metric icon={CalendarDays} label="Last activity" value={relativeDate(church.lastActivityAt)} detail="most recent signal" tone="coral" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.12fr_.88fr]">
        <section className="rounded-2xl border border-border/70 bg-muted/35 p-5" aria-labelledby="church-details-heading">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Safe church fields</p>
              <h3 id="church-details-heading" className="mt-1 font-serif text-xl font-semibold">Contact & presence</h3>
            </div>
            <Building2 className="h-5 w-5 text-primary/40" />
          </div>
          <dl className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Address</dt><dd className="mt-1 flex items-start gap-2 text-sm text-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{church.address || "No address recorded"}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Primary contact</dt><dd className="mt-1 text-sm font-semibold text-foreground">{church.adminName}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Contact email</dt><dd className="mt-1 break-all text-sm text-foreground">{church.adminEmail}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Website</dt><dd className="mt-1">{church.website ? <a href={church.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline" data-testid={`link-church-website-${church.id}`}>{church.website.replace(/^https?:\/\//, "")}<ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-sm text-muted-foreground">No website recorded</span>}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><Globe2 className="h-4 w-4 text-accent" /> Public profile is safe to share.</p>
            <Link href={publicProfileHref} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline" data-testid={`link-public-church-profile-${church.id}`}>Open public profile <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-background/70 p-5" aria-labelledby="church-access-heading">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Access, not member records</p>
              <h3 id="church-access-heading" className="mt-1 font-serif text-xl font-semibold">Administrators</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-accent/70" />
          </div>
          {detail.admins.length > 0 ? (
            <div className="mt-5 space-y-3">
              {detail.admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3" data-testid={`row-church-admin-${admin.id}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(admin.name)}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{admin.name}</p><p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="h-3 w-3" />{admin.email}</p></div>
                  <div className="text-right"><StatusPill tone={admin.role === "owner" ? "gold" : "neutral"}>{admin.role}</StatusPill><p className="mt-1 text-[10px] text-muted-foreground">Since {formatDate(admin.createdAt)}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center"><CircleAlert className="mx-auto h-5 w-5 text-secondary-foreground" /><p className="mt-2 text-sm font-semibold">No administrators returned</p><p className="mt-1 text-xs text-muted-foreground">Try refreshing this church’s access details.</p></div>
          )}
          <p className="mt-5 text-xs leading-5 text-muted-foreground">Administrator access is shown for operational care. Individual people and profile responses remain private.</p>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-secondary/35 bg-secondary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold text-foreground">Billing is read-only here</p><p className="mt-1 text-xs text-muted-foreground">{church.billingCurrentPeriodEnd ? `Current period ends ${formatDate(church.billingCurrentPeriodEnd)}.` : "No current billing period end is recorded."}</p></div>
        <span className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Plan: {labelize(church.billingPlan)} · Status: {labelize(church.billingStatus)}</span>
      </div>
    </div>
  );
}

export function ChurchManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [earlyAccessFilter, setEarlyAccessFilter] = useState<EarlyAccessFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [formError, setFormError] = useState("");

  const listParams = useMemo<GetAdminChurchesParams>(() => ({
    search: search.trim() || undefined,
    status: earlyAccessFilter === "all" ? undefined : earlyAccessFilter,
    billingPlan: billingFilter === "all" ? undefined : billingFilter,
  }), [billingFilter, earlyAccessFilter, search]);

  const listQuery = useGetAdminChurches(listParams, {
    query: {
      queryKey: getGetAdminChurchesQueryKey(listParams),
      staleTime: 30_000,
      refetchOnMount: true,
    },
  });
  const churches = listQuery.data?.items ?? [];
  const detailQuery = useGetAdminChurch(selectedId ?? 0, {
    query: {
      queryKey: getGetAdminChurchQueryKey(selectedId ?? 0),
      enabled: selectedId !== null,
      staleTime: 30_000,
      refetchOnMount: true,
    },
  });
  const updateChurch = useUpdateAdminChurch();
  const detail = detailQuery.data;

  useEffect(() => {
    if (churches.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId === null || !churches.some((church) => church.id === selectedId)) {
      setSelectedId(churches[0].id);
    }
  }, [churches, selectedId]);

  useEffect(() => {
    if (!editOpen || !detail?.church) return;
    setForm(getFormValues(detail.church));
    setFormError("");
  }, [detail?.church, editOpen]);

  const openEditor = () => {
    if (!detail?.church) return;
    setForm(getFormValues(detail.church));
    setFormError("");
    setEditOpen(true);
  };

  const updateForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
  };

  const saveChurch = () => {
    if (!selectedId || !form) return;
    if (!form.name.trim() || !form.adminName.trim() || !form.adminEmail.trim()) {
      setFormError("Church name, primary contact name, and contact email are required.");
      return;
    }
    setFormError("");
    const data: AdminChurchUpdateInput = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      website: form.website.trim() || null,
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
      earlyAccessStatus: form.earlyAccessStatus,
      foundingChurch: form.foundingChurch,
    };
    updateChurch.mutate({ id: selectedId, data }, {
      onSuccess: (result) => {
        queryClient.setQueryData(getGetAdminChurchQueryKey(selectedId), result);
        void queryClient.invalidateQueries({ queryKey: ["/api/admin/churches"] });
        toast({
          title: "Church fields saved",
          description: `${result.church.name} is up to date.`,
        });
        setEditOpen(false);
      },
      onError: () => setFormError("We couldn’t save these fields. Check the values and try again."),
    });
  };

  const clearFilters = () => {
    setSearch("");
    setEarlyAccessFilter("all");
    setBillingFilter("all");
  };

  return (
    <div className="ep-shell min-h-[100dvh] overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.19em] text-accent"><ShieldCheck className="h-4 w-4" /> EveryPart platform operations</p>
            <h1 className="font-serif text-4xl font-semibold tracking-[-.06em] text-foreground sm:text-5xl">Church care, in one clear view.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Look after participating churches with the context they need — aggregate activity, access, and safe profile details. No individual member records here.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Workspace</p><p className="mt-1 text-sm font-semibold text-foreground">CEO private console</p></div>
            <Button variant="outline" onClick={() => void listQuery.refetch()} disabled={listQuery.isFetching} className="rounded-full" data-testid="button-refresh-churches"><RefreshCw className={`mr-2 h-4 w-4 ${listQuery.isFetching ? "animate-spin" : ""}`} /> Refresh</Button>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/70 border-l-4 border-l-accent shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Building2 className="h-5 w-5" /></span><div><p className="font-serif text-3xl font-semibold tracking-[-.04em]">{churches.length}</p><p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Churches in view</p></div></CardContent></Card>
          <Card className="border-border/70 border-l-4 border-l-secondary shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-primary"><Sparkles className="h-5 w-5" /></span><div><p className="font-serif text-3xl font-semibold tracking-[-.04em]">{churches.filter((church) => church.earlyAccessStatus === "early_access").length}</p><p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Early Access</p></div></CardContent></Card>
          <Card className="border-border/70 border-l-4 border-l-primary shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></span><div><p className="font-serif text-3xl font-semibold tracking-[-.04em]">{churches.reduce((total, church) => total + church.activePeopleCount, 0).toLocaleString()}</p><p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Active people · aggregate</p></div></CardContent></Card>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          <Card className="overflow-hidden border-border/80 shadow-sm xl:sticky xl:top-5">
            <CardHeader className="border-b border-border/60 bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><CardTitle className="font-serif text-2xl tracking-tight">Church directory</CardTitle><CardDescription className="mt-1">{listQuery.isFetching && churches.length > 0 ? "Updating care list…" : `${churches.length} ${churches.length === 1 ? "church" : "churches"} matching your view`}</CardDescription></div>
                <Building2 className="mt-1 h-5 w-5 text-accent" />
              </div>
              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search church or slug" className="h-11 rounded-xl bg-background pl-9 pr-9" data-testid="input-search-churches" />
                {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear church search" data-testid="button-clear-church-search"><X className="h-4 w-4" /></button>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select value={earlyAccessFilter} onChange={(event) => setEarlyAccessFilter(event.target.value as EarlyAccessFilter)} className="h-10 min-w-0 rounded-xl border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" aria-label="Filter by access status" data-testid="select-church-status-filter">
                  <option value="all">All access</option><option value="early_access">Early Access</option><option value="standard">Standard</option>
                </select>
                <select value={billingFilter} onChange={(event) => setBillingFilter(event.target.value as BillingFilter)} className="h-10 min-w-0 rounded-xl border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" aria-label="Filter by billing plan" data-testid="select-church-billing-filter">
                  {billingPlans.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
                </select>
              </div>
              {(search || earlyAccessFilter !== "all" || billingFilter !== "all") && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-semibold text-primary hover:underline" data-testid="button-clear-church-filters">Clear filters</button>}
            </CardHeader>
            <div className="max-h-[650px] overflow-y-auto">
              {listQuery.isLoading ? <ChurchListSkeleton /> : listQuery.error ? (
                <div className="p-6 text-center"><CircleAlert className="mx-auto h-7 w-7 text-destructive" /><p className="mt-3 text-sm font-semibold">Directory unavailable</p><p className="mt-1 text-xs leading-5 text-muted-foreground">We couldn’t load the church list.</p><Button variant="outline" size="sm" onClick={() => void listQuery.refetch()} className="mt-4 rounded-full" data-testid="button-retry-churches">Try again</Button></div>
              ) : churches.length === 0 ? (
                <div className="p-7 text-center"><Search className="mx-auto h-7 w-7 text-accent" /><p className="mt-3 text-sm font-semibold">No churches found</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Try a broader search or remove a filter.</p><button type="button" onClick={clearFilters} className="mt-3 text-xs font-semibold text-primary hover:underline" data-testid="button-reset-empty-church-filters">Reset filters</button></div>
              ) : (
                <div className="space-y-1 p-2">
                  {churches.map((church) => {
                    const selected = church.id === selectedId;
                    return <button type="button" key={church.id} onClick={() => setSelectedId(church.id)} className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${selected ? "border-accent/45 bg-accent/10 shadow-sm" : "border-transparent hover:border-border/70 hover:bg-muted/50"}`} aria-pressed={selected} data-testid={`button-select-church-${church.id}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${selected ? "bg-primary text-primary-foreground" : "bg-secondary/25 text-primary"}`}>{initials(church.name)}</span>
                      <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-foreground">{church.name}</span>{church.foundingChurch && <Star className="h-3.5 w-3.5 shrink-0 fill-secondary text-secondary-foreground" />}</span><span className="mt-1 block truncate text-xs text-muted-foreground">/{church.slug}</span><span className="mt-2 flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.08em] ${church.earlyAccessStatus === "early_access" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{church.earlyAccessStatus === "early_access" ? "Early Access" : "Standard"}</span><span className="text-[10px] text-muted-foreground">{relativeDate(church.lastActivityAt)}</span></span></span><ChevronRight className={`mt-3 h-4 w-4 shrink-0 transition ${selected ? "text-accent" : "text-muted-foreground/50 group-hover:text-foreground"}`} /></button>;
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card className="min-h-[620px] overflow-hidden border-border/80 shadow-sm">
            {selectedId === null ? <EmptySelection /> : detailQuery.isLoading ? <DetailLoading /> : detailQuery.error || !detail ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center"><CircleAlert className="h-9 w-9 text-destructive" /><h2 className="mt-4 font-serif text-2xl font-semibold">Church details unavailable</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The directory is available, but this church’s operational detail could not be loaded.</p><Button variant="outline" onClick={() => void detailQuery.refetch()} className="mt-5 rounded-full" data-testid="button-retry-church-detail">Try again</Button></div>
            ) : <ChurchDetail detail={detail} onEdit={openEditor} onRefresh={() => void detailQuery.refetch()} isRefreshing={detailQuery.isFetching} />}
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-border/80 p-0">
          <DialogHeader className="border-b border-border/70 bg-muted/25 p-6 pb-5">
            <DialogTitle className="font-serif text-2xl">Edit safe church fields</DialogTitle>
            <DialogDescription className="mt-2 max-w-xl leading-6">Keep this information current so Every Part can care for the right church contact. Billing and activity data are display-only.</DialogDescription>
          </DialogHeader>
          {form && <div className="space-y-5 overflow-y-auto px-6 py-5">
            {formError && <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert" data-testid="status-save-church-error"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{formError}</div>}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field id="church-name" label="Church name" value={form.name} onChange={(value) => updateForm("name", value)} autoComplete="organization" /></div>
              <div className="sm:col-span-2"><Label htmlFor="church-address">Address</Label><Textarea id="church-address" value={form.address} onChange={(event) => updateForm("address", event.target.value)} placeholder="Street, city, state" rows={2} className="mt-2 resize-none rounded-xl" data-testid="input-church-address" /></div>
              <Field id="church-website" label="Website" value={form.website} onChange={(value) => updateForm("website", value)} type="url" placeholder="https://…" autoComplete="url" />
              <Field id="church-admin-name" label="Primary contact name" value={form.adminName} onChange={(value) => updateForm("adminName", value)} autoComplete="name" />
              <div className="sm:col-span-2"><Field id="church-admin-email" label="Primary contact email" value={form.adminEmail} onChange={(value) => updateForm("adminEmail", value)} type="email" autoComplete="email" /></div>
            </div>
            <div className="grid gap-5 border-t border-border/60 pt-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="church-access-status">Access status</Label><select id="church-access-status" value={form.earlyAccessStatus} onChange={(event) => updateForm("earlyAccessStatus", event.target.value as EditForm["earlyAccessStatus"])} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" data-testid="select-edit-church-status"><option value="early_access">Early Access</option><option value="standard">Standard</option></select><p className="text-xs leading-5 text-muted-foreground">Controls the church’s platform access label.</p></div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.foundingChurch} onChange={(event) => updateForm("foundingChurch", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--accent))]" data-testid="checkbox-edit-founding-church" /><span><span className="block text-sm font-semibold">Founding church</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Mark this church as an original Every Part participant.</span></span></label></div>
            </div>
          </div>}
          <DialogFooter className="border-t border-border/70 bg-muted/20 p-6">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="rounded-full" data-testid="button-cancel-edit-church">Cancel</Button>
            <Button type="button" onClick={saveChurch} disabled={updateChurch.isPending || !form} className="rounded-full" data-testid="button-save-church">{updateChurch.isPending ? "Saving…" : <><Check className="mr-2 h-4 w-4" />Save fields</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChurchManagement;