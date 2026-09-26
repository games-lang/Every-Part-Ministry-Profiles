import { useState } from "react";
import { Link } from "wouter";
import { CreditCard, ShieldCheck } from "lucide-react";
import {
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

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const { data: plans, isLoading: plansLoading } = useGetBillingPlans();
  const { data: subscription, isLoading: subscriptionLoading } =
    useGetBillingSubscription();
  const currentPlan = subscription?.plan ?? "starter";

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            Plan &amp; usage
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-[-.04em]">
            Church plans, coming later.
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every Part is not currently processing payments. These planned
            options remain visible so churches can understand future capacity.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-4 text-sm text-foreground">
        Every church can create unlimited Ministry Profiles during early access.
        The plan capacities below are for the future; AI credit limits still
        apply. No payment account is required, and we will provide clear notice
        before paid subscriptions become available.
      </div>

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
                    {plans?.plans.find((plan) => plan.key === currentPlan)?.name ?? "Plan unavailable"}
                  </h2>
                  <Badge variant="outline">Early access</Badge>
                </div>
              )}
              {subscription && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    {subscription.profileLimit === null
                      ? `${subscription.profilesUsed} profiles used · unlimited during early access`
                      : `${subscription.profilesUsed} of ${subscription.profileLimit} profiles used${
                          subscription.profilesRemaining === 0
                            ? " · limit reached"
                            : ` · ${subscription.profilesRemaining} remaining`
                        }`}
                  </p>
                  <p>
                    {`${subscription.aiCreditsUsed} of ${subscription.aiCreditLimit} AI credits used${
                      subscription.aiCreditsRemaining === 0
                        ? " · limit reached"
                        : ` · ${subscription.aiCreditsRemaining} remaining`
                    }`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2" aria-label="Planned billing interval">
        <Button variant={billingCycle === "monthly" ? "default" : "outline"} aria-pressed={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</Button>
        <Button variant={billingCycle === "annual" ? "default" : "outline"} aria-pressed={billingCycle === "annual"} onClick={() => setBillingCycle("annual")}>Annual · two months free</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {plans?.plans.map((plan) => (
          <Card key={plan.key} className={`min-w-0 break-words ${currentPlan === plan.key ? "border-primary shadow-sm" : "border-border/70"}`}>
            <CardHeader>
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.key === "complete" && <Badge>Most churches begin here</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-3 font-serif text-4xl font-semibold">
                {formatPrice(billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice)}
                <span className="font-sans text-sm font-normal text-muted-foreground"> / {billingCycle === "annual" ? "year" : "month"}</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Planned for a future launch
              </div>
              <p className="mt-3 text-sm font-medium">{plan.profileLimit === null ? "Unlimited profiles" : `Up to ${plan.profileLimit} profiles`}</p>
              <p className="mt-1 text-sm font-medium">{plan.aiCreditLimit.toLocaleString()} AI credits per month</p>
              <Button className="mt-6 w-full" variant="outline" disabled>Coming later</Button>
            </CardContent>
          </Card>
        ))}
        {plansLoading && <Skeleton className="col-span-full h-72" />}
        {!plans && !plansLoading && <p role="alert" className="col-span-full text-sm text-destructive">Plan pricing is temporarily unavailable. Please try again later.</p>}
      </div>
    </div>
  );
}