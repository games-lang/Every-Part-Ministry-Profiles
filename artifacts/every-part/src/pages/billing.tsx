import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  useCreateBillingCheckout,
  useCreateBillingPortal,
  useGetBillingPlans,
  useGetBillingSubscription,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const planDetails = {
  starter: {
    name: "Starter",
    description: "A low-pressure place to begin with your church.",
    price: "$0",
    profileLimit: 5,
    aiCreditLimit: 20,
  },
  growing: {
    name: "Growing",
    description: "For a small team beginning a shared ministry conversation.",
  },
  complete: {
    name: "Complete",
    description: "For churches ready for a fuller rhythm of discovery and connection.",
  },
  network: {
    name: "Network",
    description: "For churches and ministry networks growing across multiple contexts.",
  },
  unlimited: {
    name: "Unlimited",
    description: "For churches that want room for every person, without a profile cap.",
  },
} as const;
const billingSalesEnabled = false;

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export default function BillingPage() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading: plansLoading } = useGetBillingPlans();
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    refetch: refetchSubscription,
  } = useGetBillingSubscription();
  const checkout = useCreateBillingCheckout();
  const portal = useCreateBillingPortal();

  const planMap = useMemo(
    () => new Map((plans?.plans ?? []).map((plan) => [plan.key, plan])),
    [plans],
  );
  const paidAccess = subscription?.hasPaidAccess ?? false;
  const currentPlan = subscription?.plan ?? "starter";
  const queryPlan = new URLSearchParams(window.location.search).get("plan");
  const highlightedPlan =
    queryPlan === "growing" ||
    queryPlan === "complete" ||
    queryPlan === "network" ||
    queryPlan === "unlimited"
      ? queryPlan
      : null;

  const startCheckout = (
    plan: "growing" | "complete" | "network" | "unlimited",
  ) => {
    checkout.mutate(
      { data: { plan } },
      {
        onSuccess: ({ url }) => window.location.assign(url),
        onError: (error) =>
          toast({
            title: "Could not start checkout",
            description: getErrorMessage(error),
            variant: "destructive",
          }),
      },
    );
  };

  const openPortal = () => {
    portal.mutate(undefined, {
      onSuccess: ({ url }) => window.location.assign(url),
      onError: (error) =>
        toast({
          title: "Could not open billing management",
          description: getErrorMessage(error),
          variant: "destructive",
        }),
    });
  };

  const statusLabel =
    subscription?.status === "trialing"
      ? "Trialing"
      : subscription?.status === "active"
        ? "Active"
        : subscription?.status === "past_due"
          ? "Past due"
          : "Starter";

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            Church billing
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-[-.04em]">
            Church plans, coming soon.
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pricing is shown for planning. Every Part is not currently for sale,
            and paid checkout is not open yet.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-4 text-sm text-foreground">
        Every Part is coming soon. You can review the planned plans below, but
        new paid subscriptions are not currently available.
      </div>

      {new URLSearchParams(window.location.search).get("checkout") === "success" && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold">Your checkout is complete.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We’re confirming your subscription with Stripe now.
            </p>
          </div>
        </div>
      )}

      <Card className="border-primary/20 bg-primary/[.035] shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">
                Current plan
              </p>
              {subscriptionLoading ? (
                <Skeleton className="mt-2 h-7 w-44" />
              ) : (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl font-semibold">
                    {planDetails[currentPlan].name}
                  </h2>
                  <Badge variant={paidAccess ? "secondary" : "outline"}>
                    {statusLabel}
                  </Badge>
                </div>
              )}
              {subscription?.currentPeriodEnd && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Renews on{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {subscription && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    {subscription.profileLimit === null
                      ? `${subscription.profilesUsed} profiles used · unlimited`
                      : `${subscription.profilesUsed} of ${subscription.profileLimit} profiles used${
                          subscription.profilesRemaining === 0
                            ? " · limit reached"
                            : ` · ${subscription.profilesRemaining} remaining`
                        }`}
                  </p>
                  <p>
                    {subscription.aiCreditsUsed} of {subscription.aiCreditLimit} AI credits used
                    {subscription.aiCreditsRemaining === 0
                      ? " · limit reached"
                      : ` · ${subscription.aiCreditsRemaining} remaining`}
                  </p>
                </div>
              )}
            </div>
          </div>
          {paidAccess && (
            <Button
              variant="outline"
              onClick={openPortal}
              disabled={portal.isPending}
              className="shrink-0"
            >
              {portal.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Manage billing <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

       <div className="grid gap-4 lg:grid-cols-5">
        <Card className={currentPlan === "starter" ? "border-primary shadow-sm" : ""}>
          <CardHeader>
            <CardTitle>{planDetails.starter.name}</CardTitle>
            <CardDescription>{planDetails.starter.description}</CardDescription>
            <p className="pt-3 font-serif text-4xl font-semibold">
              {planDetails.starter.price}
              <span className="font-sans text-sm font-normal text-muted-foreground">
                {" "}
                / month
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Up to {planDetails.starter.profileLimit} profiles and{" "}
              {planDetails.starter.aiCreditLimit} AI credits per month. No card required.
            </p>
          </CardContent>
        </Card>

         {(["growing", "complete", "network", "unlimited"] as const).map((key) => {
          const plan = planMap.get(key);
          const details = planDetails[key];
          const selected = currentPlan === key || highlightedPlan === key;
          return (
            <Card
              key={key}
              className={selected ? "border-primary shadow-md" : "border-border/70"}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{details.name}</CardTitle>
                  {key === "complete" && <Badge>Most churches begin here</Badge>}
                </div>
                <CardDescription>{details.description}</CardDescription>
                <p className="pt-3 font-serif text-4xl font-semibold">
                  {plansLoading ? (
                    <Skeleton className="inline-block h-10 w-20 align-middle" />
                  ) : plan ? (
                    formatPrice(plan.monthlyPrice)
                  ) : (
                    "Unavailable"
                  )}
                  <span className="font-sans text-sm font-normal text-muted-foreground">
                    {" "}
                    / month
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex h-full flex-col">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                    Planned recurring billing through Stripe
                </div>
                <p className="mt-3 text-sm font-medium">
                  {plan
                    ? plan.profileLimit === null
                      ? "Unlimited profiles"
                      : `Up to ${plan.profileLimit} profiles`
                    : "— profiles"}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {plan?.aiCreditLimit ?? "—"} AI credits per month
                </p>
                <Button
                  className="mt-6 w-full"
                  variant={key === "complete" ? "default" : "outline"}
                  disabled={
                    !billingSalesEnabled ||
                    !plan ||
                    checkout.isPending ||
                    (paidAccess && currentPlan !== key) ||
                    currentPlan === key
                  }
                  onClick={() => startCheckout(key)}
                >
                  {checkout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!billingSalesEnabled
                      ? "Coming soon"
                      : currentPlan === key
                    ? "Current plan"
                    : paidAccess
                      ? "Manage in Stripe"
                      : "Start checkout"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {paidAccess && (
        <p className="text-center text-sm text-muted-foreground">
          Need a different tier? Use Manage billing to change or cancel your
          subscription securely in Stripe.
        </p>
      )}
      {!subscriptionLoading && subscription?.status === "past_due" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Your latest payment needs attention. Open Manage billing to update
          your payment method and keep access active.
        </div>
      )}
      <Button
        variant="ghost"
        className="mx-auto flex"
        onClick={() => {
          void refetchSubscription();
          setLocation("/billing");
        }}
      >
        Refresh billing status
      </Button>
    </div>
  );
}