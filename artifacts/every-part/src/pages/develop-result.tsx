import { useGetDevelopResult, getGetDevelopResultQueryKey } from "@workspace/api-client-react";
import { ArrowRight, Compass, Heart, Lightbulb, Loader2, ShieldCheck, Sparkles, Users, WandSparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DevelopResult({ params }: { params: { token: string } }) {
  const { token } = params;
  const { data: result, isLoading, error } = useGetDevelopResult(token, {
    query: { enabled: !!token, queryKey: getGetDevelopResultQueryKey(token) },
  });
  if (isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (error || !result) return <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4"><Card className="w-full max-w-md text-center"><CardContent className="space-y-3 p-7"><h1 className="font-serif text-2xl font-medium text-destructive">Result not found</h1><p className="text-muted-foreground">This result link may have expired or is invalid.</p></CardContent></Card></div>;
  const { summary } = result;
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"><Sparkles className="h-10 w-10" /></div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Develop Profile</p>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Keep growing, {result.childName}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">You took time to notice what matters to you, how you work with others, and a next step to try.</p>
        </div>
        <Card className="overflow-hidden border-border/60 shadow-xl">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-chart-3" />
          <CardContent className="space-y-8 p-6 sm:p-10">
            <div className="text-center"><h2 className="font-serif text-2xl font-medium">{summary.headline}</h2></div>
            <section className="rounded-2xl border border-secondary/15 bg-secondary/5 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-medium text-secondary"><Heart className="h-5 w-5" />What we noticed</h3>
              <div className="flex flex-wrap gap-2">{summary.strengths.map((item) => <span key={item} className="rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium">{item}</span>)}</div>
            </section>
            <section className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-primary"><Compass className="h-5 w-5" />How you tend to operate</h3>
              <p className="text-sm leading-relaxed text-foreground/90">{summary.tendencySummary}</p>
            </section>
            <section className="rounded-2xl border border-chart-3/15 bg-chart-3/5 p-6">
              <h3 className="mb-2 flex items-center gap-2 font-medium text-chart-3"><WandSparkles className="h-5 w-5" />Gifts you may want to explore</h3>
              <p className="mb-4 text-sm text-muted-foreground">These are areas to explore through prayer, practice, and conversations—not a final answer about you.</p>
              <div className="flex flex-wrap gap-2">{summary.giftsToExplore.map((item) => <span key={item} className="rounded-full border border-chart-3/20 bg-background px-4 py-2 text-sm font-medium">{item}</span>)}</div>
            </section>
            <section className="rounded-2xl border border-border/60 bg-muted/20 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-medium"><Lightbulb className="h-5 w-5 text-chart-4" />Calling & purpose</h3>
              <p className="text-sm leading-relaxed text-foreground/90">{summary.callingSummary}</p>
              <p className="mt-3 text-xs text-muted-foreground">Calling can be lived out in any vocation. You do not need to choose a career or ministry role today.</p>
            </section>
            <section>
              <h3 className="mb-4 flex items-center gap-2 font-medium"><Users className="h-5 w-5 text-primary" />Ministry interests to explore</h3>
              <div className="grid gap-3 sm:grid-cols-2">{summary.ministryInterests.map((item) => <div key={item.opportunityKey} className="rounded-xl border border-border/60 bg-card p-4"><p className="font-medium">{item.opportunityLabel}</p><p className="mt-1 text-sm text-muted-foreground">{item.response === "love" ? "I’d love to try this" : "Maybe—let’s learn more"}</p></div>)}</div>
            </section>
            <section className="rounded-2xl border-2 border-primary/15 bg-primary/[0.03] p-6">
              <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-medium"><ShieldCheck className="h-5 w-5 text-primary" />My development plan</h3>
              <p className="mb-4 text-sm leading-relaxed"><span className="font-medium">Goal:</span> {summary.developmentPlan.goal}</p>
              <ul className="space-y-2">{summary.developmentPlan.nextSteps.map((step) => <li key={step} className="flex items-start gap-2 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />{step}</li>)}</ul>
              {summary.developmentPlan.supportNeeded && <p className="mt-4 border-t border-border/40 pt-4 text-sm text-muted-foreground"><span className="font-medium text-foreground">Support that may help:</span> {summary.developmentPlan.supportNeeded}</p>}
            </section>
            <p className="border-t border-border/40 pt-6 text-center text-sm font-medium leading-relaxed text-muted-foreground">{summary.completionCopy}</p>
          </CardContent>
        </Card>
        <div className="text-center"><p className="mb-5 text-sm text-muted-foreground">A copy of this profile has been shared with approved ministry leaders.</p><Button asChild variant="outline"><Link href="/">Return to homepage<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
      </div>
    </div>
  );
}