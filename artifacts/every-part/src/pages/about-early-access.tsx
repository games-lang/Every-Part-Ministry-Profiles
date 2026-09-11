import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const feedbackExamples = [
  "Something that was confusing or difficult to find",
  "A Ministry Profile question that was unclear",
  "A PartFinder recommendation that was especially helpful or unhelpful",
   "Something a pastor expected Every Part to help with",
  "A feature that would make Every Part more useful in real ministry",
  "Something members struggled to understand",
];

export default function AboutEarlyAccess() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/80 bg-background/95">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-sm font-semibold text-foreground">
            Every Part
          </Link>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            Every Part Early Access
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            Helping shape a better way for people to serve.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Every Part Early Access gives a small group of churches the
            opportunity to begin using Every Part today while helping shape the
             Every Part for churches everywhere.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">What is Early Access?</CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-muted-foreground">
              These churches help us learn how Every Part works in real
               ministry environments and identify ways Every Part can become
              clearer, more useful, and more effective.
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                Is Every Part ready to use?
              </CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-muted-foreground">
              Yes. The core Every Part experience is designed for real
              churches. Some features may continue to evolve as we learn from
              participating churches.
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <ShieldCheck className="h-5 w-5 text-primary" />
                How is church information handled?
              </CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-muted-foreground">
              Early Access does not mean private church or member information
              is publicly exposed or casually used for experimentation.
              Feedback and aggregate usage patterns may help improve the
               Every Part, while privacy remains a priority.
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <MessageSquareText className="h-5 w-5 text-accent" />
                What feedback is helpful?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {feedbackExamples.map((example) => (
                  <li key={example} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-5 rounded-full">
                <Link href="/sign-in">Share feedback</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5 border-primary/15 bg-primary/[.035] shadow-sm">
          <CardContent className="p-6 leading-7 text-muted-foreground">
            <p className="font-serif text-2xl text-foreground">
              Every person has a part to play in the Body of Christ.
            </p>
            <p className="mt-3">
               Thank you for helping us build a polished way for churches to
               help every person find their part and keep growing.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}