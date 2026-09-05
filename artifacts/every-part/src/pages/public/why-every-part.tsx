import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { PublicLayout, Reveal, Eyebrow } from "@/components/public-layout";

export default function WhyEveryPart() {
  return (
    <PublicLayout 
      title="Why Every Part | The question behind the work" 
      description="Churches are full of people ready to contribute. The hard part is slowing down long enough to discover how. See the philosophy behind Every Part."
    >
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <Reveal>
                <Eyebrow>The question behind the work</Eyebrow>
                <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                  Churches are full of people ready to contribute.
                </h1>
                <p className="mt-8 max-w-xl font-serif text-2xl leading-tight tracking-[-.04em] text-muted-foreground sm:text-3xl">
                  The hard part is slowing down long enough to discover how.
                </p>
                <div className="mt-10 max-w-xl space-y-6 text-lg leading-8 text-foreground">
                  <p>
                    For many leaders, the pressure to fill immediate ministry needs often overshadows the opportunity to discover who God has actually placed in their congregation. When we move too fast, we ask whoever is willing or whoever we already know. The same faithful volunteers carry the load while other gifts and abilities remain unseen.
                  </p>
                  <p>
                    Every Part exists to change this dynamic. It's a tool designed to help leaders slow down. Before you ask someone to serve, Every Part gives you a fuller picture of their story—their gifts, passions, how they naturally operate, and the season they are currently in.
                  </p>
                </div>
              </Reveal>
            </div>
            
            <Reveal className="[animation-delay:.15s]">
              <div className="relative rounded-[2rem] bg-secondary px-8 py-14 text-secondary-foreground sm:p-16">
                <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border-[20px] border-white/20" aria-hidden="true" />
                <p className="relative z-10 text-xs font-bold uppercase tracking-[.18em]">Our Philosophy</p>
                <h3 className="relative z-10 mt-6 font-serif text-3xl leading-[1.1] tracking-[-.04em] sm:text-4xl">
                  Technology should prepare a conversation, never replace it.
                </h3>
                <p className="relative z-10 mt-6 text-base leading-7 text-secondary-foreground/80">
                  We believe that matching a person to a ministry should not be left to an algorithm. Every Part is built to assist ministry leaders—not replace prayer, pastoral relationships, or the work of the Holy Spirit.
                </p>
                <Link href="/sign-up" className="landing-focus relative z-10 mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-accent">
                  Try Every Part <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <Eyebrow light><span className="mx-auto">The Biblical Foundation</span></Eyebrow>
              <blockquote className="mt-12 font-serif text-4xl leading-[1.04] tracking-[-.045em] sm:text-5xl lg:text-7xl">
                “Just as a body, though one, has many parts, but all its many parts form one body, so it is with Christ.”
              </blockquote>
              <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--landing-cyan))]">
                — 1 Corinthians 12:12 <span className="ml-2 font-medium opacity-70">NIV</span>
              </p>
              <p className="mx-auto mt-10 max-w-3xl text-xl leading-8 text-[hsl(var(--landing-light-text))]">
                Every Part is built around this picture: a church is not a collection of disconnected roles, but one body with many meaningful parts. When each part discovers its place, the whole body thrives.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
