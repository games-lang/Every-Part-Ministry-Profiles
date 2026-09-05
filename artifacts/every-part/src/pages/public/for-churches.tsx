import { Link } from "wouter";
import { ArrowRight, BookOpen, Check, HeartHandshake, LockKeyhole, Orbit, UsersRound } from "lucide-react";
import { PublicLayout, Reveal, Eyebrow } from "@/components/public-layout";
import { leaderBenefits } from "@/data/public-content";

export default function ForChurches() {
  return (
    <PublicLayout 
      title="For Churches | Every Part" 
      description="Every Part gives leaders a clearer picture of the people God has already placed in their congregation."
    >
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <Reveal>
              <Eyebrow>For churches</Eyebrow>
              <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                See Your Church Differently
              </h1>
            </Reveal>
            <Reveal className="[animation-delay:.1s]">
              <p className="text-lg leading-8 text-muted-foreground">
                Every Part gives leaders a clearer picture of the people God has already placed in their congregation.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <Reveal>
              <div className="h-full rounded-[1.75rem] bg-primary p-8 text-primary-foreground sm:p-12">
                <div className="flex items-start justify-between">
                  <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-[hsl(var(--landing-cyan))]">A leader’s view</span>
                  <UsersRound className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-24 max-w-xl font-serif text-4xl leading-[1.02] tracking-[-.06em] sm:text-5xl">Healthier teams start with knowing your people.</h3>
                <p className="mt-6 max-w-xl text-base leading-7 text-[hsl(var(--landing-light-text))]">
                  Build a shared language for serving. Notice where people are thriving. Return to the conversation when a season changes.
                </p>
                <Link href="/sign-up" className="landing-focus mt-10 inline-flex items-center gap-3 rounded-full bg-secondary px-6 py-3.5 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90">
                  Create a church profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-4">
              <Reveal className="[animation-delay:.08s]">
                <div className="landing-card rounded-[1.5rem] border border-border bg-card p-7 sm:p-8">
                  <div className="flex items-center justify-between"><BookOpen className="h-6 w-6 text-secondary" /><span className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">01 / Prepare</span></div>
                  <h3 className="mt-16 font-serif text-3xl tracking-[-.05em]">Give leaders better questions.</h3>
                  <ul className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">{leaderBenefits.map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-secondary" />{item}</li>)}</ul>
                </div>
              </Reveal>
              <Reveal className="[animation-delay:.16s]">
                <div className="landing-card rounded-[1.5rem] border border-border bg-card p-7 sm:p-8">
                  <div className="flex items-center justify-between"><Orbit className="h-6 w-6 text-secondary" /><span className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">02 / Keep walking</span></div>
                  <h3 className="mt-16 font-serif text-3xl tracking-[-.05em]">Make room for development.</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">Serving is not the finish line. Follow up, learn together, and adjust as people grow.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--primary-deep))] px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-24">
          <Reveal>
            <Eyebrow light>Trust &amp; privacy</Eyebrow>
             <h2 className="mt-6 max-w-2xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">Your People Matter. Their Information Does Too.</h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[hsl(var(--landing-light-text))]">
               Every Part uses church-controlled access and permission-based leader access to support responsible handling of member information. Profiles are designed to protect sensitive profile information and give leaders secure accounts for the ministry conversations their church chooses to have.
            </p>
             <p className="mt-6 max-w-xl border-l-2 border-secondary pl-5 text-base leading-7 text-[hsl(var(--landing-light-text))]">
               Every Part is designed to assist ministry leaders—not replace prayer, pastoral relationships, or the work of the Holy Spirit.
             </p>
             <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-primary-foreground">
               <Link href="/privacy" className="landing-focus rounded-md underline decoration-secondary underline-offset-4 hover:text-secondary" data-testid="link-trust-privacy">Read our Privacy Policy</Link>
               <Link href="/terms" className="landing-focus rounded-md underline decoration-secondary underline-offset-4 hover:text-secondary" data-testid="link-trust-terms">Read our Terms of Service</Link>
             </div>
          </Reveal>
          <Reveal className="[animation-delay:.12s]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/15 bg-white/[.06] p-7">
                <LockKeyhole className="h-6 w-6 text-secondary" />
                <h3 className="mt-16 font-serif text-2xl tracking-[-.04em]">A thoughtful place for a story.</h3>
                 <p className="mt-4 text-sm leading-6 text-[hsl(var(--landing-light-text))]">Church-controlled access, permission-based leader access, and protection of sensitive profile information keep the focus on people.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/[.06] p-7 sm:translate-y-8">
                <HeartHandshake className="h-6 w-6 text-secondary" />
                <h3 className="mt-16 font-serif text-2xl tracking-[-.04em]">A human decision, every time.</h3>
                <p className="mt-4 text-sm leading-6 text-[hsl(var(--landing-light-text))]">Suggestions are a place to begin. Prayer, relationship, and discernment determine the next step.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
