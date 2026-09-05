import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { PublicLayout, Reveal, Eyebrow } from "@/components/public-layout";

export default function WhyEveryPart() {
  return (
    <PublicLayout 
      title="Why Every Part | The story behind the work" 
      description="Every Part began with a problem in a real church: how to see the gifts, stories, and potential of people God has already placed in the body."
    >
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <Reveal>
                <Eyebrow>The story behind the work</Eyebrow>
                <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                  Every Part began with a problem in our own church.
                </h1>
                <p className="mt-8 max-w-xl font-serif text-2xl leading-tight tracking-[-.04em] text-muted-foreground sm:text-3xl">
                  The people were there. The gifts were there. We needed a clearer way to see them.
                </p>
                <div className="mt-10 max-w-xl space-y-6 text-lg leading-8 text-foreground">
                  <p>
                    My wife and I found ourselves doing what felt like 90% of the work of the church. This was not a tiny congregation—we had around 150 people who could participate in the life and ministry of the church.
                  </p>
                  <p>
                    People loved Jesus, cared about the church, and had something meaningful to contribute. The problem was that I did not yet have a clear enough picture of how God had shaped each person or how to connect them with the right opportunity.
                  </p>
                </div>
              </Reveal>
            </div>
            
            <Reveal className="[animation-delay:.15s]">
              <div className="relative rounded-[2rem] bg-secondary px-8 py-14 text-secondary-foreground sm:p-16">
                <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border-[20px] border-white/20" aria-hidden="true" />
                <p className="relative z-10 text-xs font-bold uppercase tracking-[.18em]">The question that changed the approach</p>
                <h3 className="relative z-10 mt-6 font-serif text-3xl leading-[1.1] tracking-[-.04em] sm:text-4xl">
                  “How has God shaped this person, and where might they flourish?”
                </h3>
                <p className="relative z-10 mt-6 text-base leading-7 text-secondary-foreground/80">
                  That question moves the starting point from “Who can we get to fill this spot?” to a more prayerful conversation about gifts, calling, capacity, and the next healthy step.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/60 px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-24">
          <Reveal>
            <Eyebrow>Making room for every story</Eyebrow>
            <h2 className="mt-6 max-w-2xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-5xl">
              We needed a way to see people across difference.
            </h2>
            <div className="mt-8 max-w-xl space-y-6 text-lg leading-8 text-muted-foreground">
              <p>
                Our church was multicultural, made up of five different language groups. We needed to understand our people across language, culture, age, and background.
              </p>
              <p>
                We did not want language to keep someone’s gifts from being seen, age to cause someone’s potential to be overlooked, or ministry opportunities to keep going primarily to the same handful of people simply because they were the people we already knew to ask.
              </p>
            </div>
          </Reveal>

          <Reveal className="[animation-delay:.12s]">
            <div className="rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-[0_24px_60px_hsl(var(--foreground)/.12)] sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--landing-cyan))]">What we wanted to understand</p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  "How has God gifted this person?",
                  "What are they passionate about?",
                  "What experiences have shaped them?",
                  "What kind of ministry might bring them joy and help them grow?",
                  "Where could they meaningfully contribute to the Body of Christ?",
                ].map((question) => (
                  <p key={question} className="border-b border-white/15 pb-4 text-base leading-7 text-[hsl(var(--landing-light-text))]">
                    {question}
                  </p>
                ))}
              </div>
              <p className="mt-8 border-l-2 border-secondary pl-5 font-serif text-2xl leading-tight text-white sm:text-3xl">
                Not simply a volunteer schedule. A fuller picture before the next conversation.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border bg-primary px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <Eyebrow light><span className="mx-auto">The biblical foundation</span></Eyebrow>
              <blockquote className="mt-12 font-serif text-4xl leading-[1.04] tracking-[-.045em] sm:text-5xl lg:text-7xl">
                “Just as a body, though one, has many parts, but all its many parts form one body, so it is with Christ.”
              </blockquote>
              <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--landing-cyan))]">
                — 1 Corinthians 12:12 <span className="ml-2 font-medium opacity-70">NIV</span>
              </p>
              <p className="mx-auto mt-10 max-w-3xl text-xl leading-8 text-[hsl(var(--landing-light-text))]">
                That became the heart behind Every Part: helping pastors and ministry leaders better understand the people God has already placed in their churches so every person can discover that they have a part in the Body—and their part matters.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" className="landing-focus inline-flex items-center gap-3 rounded-full bg-secondary px-6 py-3.5 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90">
                  Try Every Part <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/how-it-works" className="landing-focus inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-semibold transition hover:bg-white/10">
                  See how it works <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
