import { Link } from "wouter";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Compass,
  HeartHandshake,
  Map,
  Menu,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

const ageProfiles = [
  {
    icon: Sparkles,
    age: "Ages 6–8",
    title: "Discover",
    description:
      "A playful first look at what children enjoy, how they like to help, and what they are curious about.",
    prompt: "What do I enjoy?",
  },
  {
    icon: Compass,
    age: "Ages 9–12",
    title: "Explore",
    description:
      "A guided opportunity to notice interests, strengths, and ways they may want to serve or learn next.",
    prompt: "What might I want to try?",
  },
  {
    icon: Map,
    age: "Ages 13–17",
    title: "Develop",
    description:
      "A thoughtful teen reflection on growth, calling, ministry interests, responsibility, and next steps.",
    prompt: "How am I growing?",
  },
  {
    icon: HeartHandshake,
    age: "Ages 18+",
    title: "Adult Ministry Profile",
    description:
      "A conversation-ready picture of experience, gifts, strengths, passions, rhythms, and availability.",
    prompt: "How might I serve?",
  },
];

const steps = [
  {
    icon: Settings2,
    number: "01",
    title: "Set Up Your Church’s Ministry Profile",
    description:
      "Customize the profile around your church, ministry teams, and serving opportunities.",
  },
  {
    icon: Users,
    number: "02",
    title: "Invite Members to Complete Their Profile",
    description:
      "Members reflect on their gifts, passions, ministry style, experience, availability, spiritual health, and calling.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Meet and Discern Together",
    description:
      "A leader meets with each person to hear their story, discuss the profile, and prayerfully discern next steps.",
  },
  {
    icon: Map,
    number: "04",
    title: "Connect Them to Their Part",
    description:
      "Help each person join a ministry team that fits their gifting, calling, passions, and current season.",
  },
  {
    icon: Sparkles,
    number: "05",
    title: "Follow Up and Develop",
    description:
      "Check in after they begin serving. Make sure the fit is healthy, help them grow, and adjust their ministry role when needed.",
  },
];

export default function LandingPage() {
  return (
    <div className="ep-landing min-h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Every Part home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-serif text-lg font-bold text-primary-foreground">E</span>
            <span className="font-serif text-lg font-semibold tracking-[-.04em]">Every Part</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="landing-link">How it works</a>
            <a href="#assessment" className="landing-link">The assessment</a>
            <a href="#for-leaders" className="landing-link">For church leaders</a>
            <Link href="/sign-in" className="landing-link">Sign in</Link>
            <Link href="/sign-up" className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:bg-accent">Get started</Link>
          </nav>
          <a href="#how-it-works" className="rounded-lg border border-border p-2.5 md:hidden" aria-label="Jump to how Every Part works">
            <Menu className="h-5 w-5" />
          </a>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:pb-32 lg:pt-28">
          <div className="pointer-events-none absolute -right-28 top-8 h-80 w-80 rounded-full border-[40px] border-[hsl(var(--landing-cyan)/.6)] sm:h-[30rem] sm:w-[30rem]" />
          <div className="pointer-events-none absolute right-32 top-52 hidden h-3 w-3 rounded-full bg-secondary sm:block" />
          <div className="relative grid items-end gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
            <div>
              <div className="landing-reveal mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[.18em] text-accent">
                <span className="h-px w-8 bg-secondary" />
                For church leaders &amp; pastors
              </div>
              <h1 className="landing-reveal landing-reveal-delay max-w-3xl font-serif text-[clamp(3.3rem,8vw,7.7rem)] font-semibold leading-[.93] tracking-[-.075em]">
                Every person has a <span className="text-accent">part.</span>{" "}
                Help them discover it.
              </h1>
              <p className="landing-reveal landing-reveal-delay-2 mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Every Part helps churches understand people&apos;s gifts, passions, ministry style, availability, and readiness so leaders can build healthier ministry teams.
              </p>
              <div className="landing-reveal landing-reveal-delay-2 mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-[0_12px_24px_hsl(var(--foreground)/.16)] transition hover:-translate-y-0.5 hover:bg-accent">
                  Start Free for Your Church <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/profile/riverstone-community" className="inline-flex items-center justify-center rounded-full border border-border bg-background/50 px-7 py-4 font-semibold transition hover:border-secondary hover:text-secondary">
                  Preview Assessment
                </Link>
              </div>
            </div>
            <div className="relative min-h-[280px] lg:min-h-[390px]">
              <div className="absolute bottom-2 right-0 w-full max-w-[470px] rotate-[-3deg] rounded-[2rem] border border-white/70 bg-primary p-5 text-primary-foreground shadow-[0_28px_60px_hsl(var(--foreground)/.22)] sm:p-7">
                <div className="mb-16 flex items-center justify-between text-xs uppercase tracking-[.15em] text-[hsl(var(--landing-slate))]"><span>Discovery / 01</span><Sparkles className="h-4 w-4 text-secondary" /></div>
                <p className="max-w-xs font-serif text-3xl leading-tight tracking-[-.045em] sm:text-4xl">What gives you energy when you’re serving others?</p>
                <div className="mt-12 flex items-center justify-between border-t border-white/15 pt-4 text-sm text-[hsl(var(--landing-slate))]"><span>Thoughtful questions</span><ArrowDownRight className="h-5 w-5 text-secondary" /></div>
              </div>
              <div className="absolute -bottom-4 left-4 h-28 w-28 rounded-3xl bg-[hsl(var(--landing-cyan))] sm:left-0 sm:h-36 sm:w-36" />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-muted px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">The challenge churches face</p>
              <div>
                <h2 className="max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">From filling gaps to finding a fit.</h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                  Many churches know people want to serve, but leaders often don&apos;t know their gifts, interests, capacity, or the ministry environments where they&apos;ll thrive.
                </p>
              </div>
            </div>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">How it works</p>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
                A simple path takes people from discovery to meaningful service—and gives leaders a way to keep walking with them.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className={`landing-card rounded-[1.5rem] border border-border bg-card p-7 sm:p-8 ${index >= 3 ? "lg:col-span-3" : "lg:col-span-2"}`}>
                  <div className="mb-16 flex items-start justify-between"><span className="text-xs font-bold tracking-[.15em] text-muted-foreground">{step.number}</span><step.icon className="h-6 w-6 text-secondary" /></div>
                  <h3 className="font-serif text-2xl font-semibold tracking-[-.04em]">{step.title}</h3>
                  <p className="mt-4 leading-7 text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 grid gap-6 rounded-[1.5rem] border border-border bg-card p-7 sm:p-9 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">The Every Part shift</p>
                <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-[-.04em]">Everyone has a calling in the church.</h3>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Ministry Profiles help people discover that calling by connecting their passions and spiritual gifts with the places, people, and ministry environments where they are ready to contribute. Leaders move from recruiting around urgent needs to building healthier teams of people who are called, equipped, and energized to serve.
              </p>
            </div>
          </div>
        </section>

        <section id="assessment" className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">One pathway, shaped for every age</p>
              <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">
                The right starting point for every person.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Every Part grows with people. Each profile uses age-appropriate questions to help someone notice how they are made, what they care about, and what they may want to explore next.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ageProfiles.map((profile) => (
                <article key={profile.title} className="landing-card flex min-h-[330px] flex-col rounded-[1.5rem] border border-border bg-card p-6 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary">
                      <profile.icon className="h-5 w-5" />
                    </div>
                    <span className="pt-2 text-xs font-bold uppercase tracking-[.12em] text-accent">{profile.age}</span>
                  </div>
                  <div className="mt-12">
                    <h3 className="font-serif text-3xl font-semibold tracking-[-.045em]">{profile.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{profile.description}</p>
                  </div>
                  <p className="mt-auto border-t border-border pt-5 font-serif text-lg leading-snug text-foreground">
                    “{profile.prompt}”
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">What the assessment explores</p>
                <h3 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-5xl">
                  More than a volunteer form.
                </h3>
                <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                  Members reflect on the experiences, gifts, strengths, and rhythms that shape how they serve. The result is a conversation-ready Ministry Profile—not a rigid label or a one-size-fits-all placement.
                </p>
                <div className="mt-8 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    "Background & experience",
                    "Spiritual gifts",
                    "Fivefold / APEST expressions",
                    "Passions & ministry interests",
                    "Natural strengths",
                    "Personality & working style",
                    "Spiritual health & rhythms",
                    "Church connection & availability",
                  ].map((part) => (
                    <div key={part} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-secondary" />
                      <span>{part}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-muted p-7 sm:p-9">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Settings2 className="h-5 w-5" />
                </div>
                <h3 className="mt-8 font-serif text-3xl font-semibold tracking-[-.04em]">Make it yours.</h3>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Every church can shape the assessment around its own ministry context. In Church Setup, pastors can:
                </p>
                <ul className="mt-6 space-y-4 text-sm leading-6">
                  {[
                    "Enable or hide complete sections.",
                    "Choose which question groups appear within each section.",
                    "Keep the generic options and add church-specific passions and ministry interests.",
                    "Update the assessment for future members without changing historical profiles.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 border-t border-border pt-6 text-sm font-medium text-foreground">
                  Thoughtful by default. Flexible by design.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="for-leaders" className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-accent text-primary-foreground lg:grid-cols-[1fr_.8fr]">
            <div className="p-8 sm:p-14 lg:p-20">
              <p className="mb-8 text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--landing-cyan))]">Built for the people who care for people</p>
              <h2 className="max-w-2xl font-serif text-4xl font-semibold leading-[1.05] tracking-[-.055em] sm:text-6xl">Make room for the conversation.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[hsl(var(--landing-light-text))]">Set up your church&apos;s custom discovery assessment in under 5 minutes. Then spend your time doing what matters: knowing your people.</p>
              <Link href="/sign-up" className="mt-10 inline-flex items-center gap-3 rounded-full bg-secondary px-7 py-4 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90">Create Your Church Profile <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="relative min-h-[250px] overflow-hidden bg-[hsl(var(--primary-deep))] lg:min-h-full">
              <div className="absolute -right-12 top-12 h-72 w-72 rounded-full border-[34px] border-[hsl(var(--accent)/.75)]" />
              <div className="absolute bottom-10 left-10 max-w-[240px] rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><Check className="mb-8 h-5 w-5 text-[hsl(var(--landing-cyan))]" /><p className="font-serif text-xl leading-snug">The right fit starts with seeing the whole person.</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary font-serif text-xs text-primary-foreground">E</span> Every Part</Link>
          <p>Helping every person find a meaningful way to serve.</p>
        </div>
      </footer>
    </div>
  );
}