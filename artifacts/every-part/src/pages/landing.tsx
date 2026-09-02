import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Cross,
  Heart,
  HeartHandshake,
  LockKeyhole,
  Menu,
  Network,
  Orbit,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { PuzzleCluster } from "@/components/puzzle-cluster";
import { PuzzlePiece } from "@/components/puzzle-piece";

const pathway = [
  {
    number: "01",
    icon: Cross,
    title: "Pray",
    description:
      "Begin with prayer and see people as God sees them.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Set Up",
    description:
      "Create a thoughtful process your church can own.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Discover",
    description:
      "Invite people to name gifts, passions, and availability.",
  },
  {
    number: "04",
    icon: Compass,
    title: "Discern",
    description:
      "Turn reflections into a conversation about calling.",
  },
  {
    number: "05",
    icon: Network,
    title: "Connect",
    description:
      "Connect people with meaningful places to serve.",
  },
  {
    number: "06",
    icon: Orbit,
    title: "Develop",
    description:
      "Keep noticing, growing, and revisiting the journey.",
  },
];

const dimensions = [
  ["Spiritual Gifts", "How has the Holy Spirit equipped me?"],
  ["APEST", "How do I tend to contribute to the mission of the Church?"],
  ["How You Tend to Operate", "How do I naturally relate, decide, organize, and work with others?"],
  ["Passions", "Who or what has God placed on my heart?"],
  ["Skills & Experience", "What has God already developed in me?"],
  ["Spiritual Health", "How am I doing in my relationship with Christ?"],
  ["Availability & Current Season", "What commitment is realistic and healthy right now?"],
  ["Ministry Interests", "Where am I drawn toward serving?"],
];

const problemCards = [
  ["Hidden Gifts", "People in your congregation may have gifts and abilities leaders do not yet know about."],
  ["The Same People Serve", "A small group of faithful volunteers often carries most of the ministry load."],
  ["People Don’t Know Where to Begin", "Many people are willing to serve but are unsure where they belong."],
  ["Leaders Are Guessing", "Church leaders often recruit from the people they already know instead of seeing the full potential of the congregation."],
];

const leaderBenefits = [
  "View completed Ministry Profiles",
  "Search by gifts and passions",
  "Understand availability",
  "Discover potential ministry matches",
  "Identify emerging leaders",
  "Discover overlooked abilities",
  "Track profile completion",
  "Build healthier ministry teams",
];

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }

    if (!("IntersectionObserver" in window)) {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.14 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`landing-reveal ${className}`}>
      {children}
    </div>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] ${light ? "text-[hsl(var(--landing-cyan))]" : "text-accent"}`}>
      <span className={`h-px w-8 ${light ? "bg-secondary" : "bg-secondary"}`} />
      {children}
    </p>
  );
}

function ScriptureCallout({
  verse,
  reference,
  dark = false,
}: {
  verse: string;
  reference: string;
  dark?: boolean;
}) {
  return (
    <figure className={`landing-scripture ${dark ? "landing-scripture--dark" : ""}`}>
      <blockquote className="font-serif text-xl leading-tight tracking-[-.025em] sm:text-2xl">“{verse}”</blockquote>
      <figcaption className="mt-4 text-xs font-bold uppercase tracking-[.16em]">
        — {reference} <span className="ml-2 font-medium opacity-70">NIV</span>
      </figcaption>
    </figure>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="ep-landing min-h-[100dvh] overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="landing-focus rounded-xl" aria-label="Every Part home" onClick={closeMenu}>
            <Brand />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="landing-focus landing-link rounded-md px-1 py-2">How It Works</a>
            <a href="#ministry-profile" className="landing-focus landing-link rounded-md px-1 py-2">Ministry Profile</a>
            <a href="#for-churches" className="landing-focus landing-link rounded-md px-1 py-2">For Churches</a>
            <Link href="/pricing" className="landing-focus landing-link rounded-md px-1 py-2" data-testid="link-home-pricing">Pricing</Link>
            <Link href="/sign-in" className="landing-focus landing-link rounded-md px-1 py-2">Login</Link>
            <Link href="/sign-up" className="landing-focus ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent">
              Try Every Part <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>

          <button
            type="button"
            className="landing-focus inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="landing-menu border-t border-border bg-background px-5 py-4 lg:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a href="#how-it-works" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">How It Works</a>
              <a href="#ministry-profile" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">Ministry Profile</a>
              <a href="#for-churches" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">For Churches</a>
              <Link href="/pricing" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-home-mobile-pricing">Pricing</Link>
              <Link href="/sign-in" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">Login</Link>
              <Link href="/sign-up" onClick={closeMenu} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Try Every Part <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pb-32 sm:pt-24 lg:pb-36 lg:pt-28">
          <div className="landing-grid pointer-events-none absolute right-[-5rem] top-0 h-[33rem] w-[33rem] opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[9%] top-20 h-3 w-3 rounded-full bg-secondary" aria-hidden="true" />
          <div className="relative grid items-center gap-16 lg:grid-cols-[1fr_.86fr] lg:gap-24">
            <div>
              <Reveal>
                <Eyebrow>For pastors &amp; church leaders</Eyebrow>
              </Reveal>
              <Reveal className="[animation-delay:.1s]">
                <h1 className="mt-7 max-w-3xl font-serif text-[clamp(3.2rem,7.4vw,7.1rem)] font-semibold leading-[.92] tracking-[-.08em]">
                  Every person has a <span className="text-accent">part.</span>{" "}
                  Help them discover it.
                </h1>
              </Reveal>
              <Reveal className="[animation-delay:.2s]">
                <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  Every Part helps churches prayerfully discover the gifts, passions, calling, ministry potential, and availability of their people—and connect them with a place to serve and grow.
                </p>
              </Reveal>
              <Reveal className="[animation-delay:.3s]">
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/sign-up" className="landing-focus inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-[0_14px_30px_hsl(var(--foreground)/.16)] transition hover:-translate-y-0.5 hover:bg-accent">
                    Try Every Part <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#how-it-works" className="landing-focus inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-7 py-4 font-semibold transition hover:border-secondary hover:text-secondary">
                    See How It Works <ChevronDown className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>
              <Reveal className="[animation-delay:.4s]">
                <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--landing-cyan))] text-primary"><Heart className="h-4 w-4" /></span>
                  <span>A ministry conversation, not a personality label.</span>
                </div>
              </Reveal>
            </div>

            <Reveal className="[animation-delay:.16s]">
              <div className="relative mx-auto w-full max-w-[510px] lg:mr-0">
                <div className="absolute -right-4 -top-8 h-40 w-40 rounded-full border-[22px] border-secondary/70 sm:-right-10 sm:-top-10 sm:h-56 sm:w-56 sm:border-[30px]" aria-hidden="true" />
                <div className="relative rounded-[2rem] border border-primary/10 bg-primary p-5 text-primary-foreground shadow-[0_30px_70px_hsl(var(--foreground)/.2)] sm:p-7">
                  <PuzzleCluster size="sm" className="pointer-events-none absolute bottom-5 right-5 z-0 opacity-15" />
                  <div className="flex items-center justify-between border-b border-white/15 pb-5 text-[11px] uppercase tracking-[.18em] text-[hsl(var(--landing-slate))]">
                    <span>Ministry Profile / Sarah</span>
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary" /> In conversation</span>
                  </div>
                  <div className="relative z-10 py-8 sm:py-12">
                    <p className="text-sm text-[hsl(var(--landing-slate))]">A question worth asking</p>
                    <p className="mt-4 max-w-sm font-serif text-3xl leading-[1.05] tracking-[-.055em] sm:text-4xl">
                      Where do you notice God giving you energy to help others?
                    </p>
                  </div>
                  <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-sm text-[hsl(var(--landing-slate))]">
                    <span>Thoughtful questions</span>
                    <ArrowRight className="h-4 w-4 text-secondary" />
                  </div>
                </div>
                <div className="absolute -bottom-8 -left-4 rounded-2xl border border-border bg-card p-4 shadow-[0_14px_35px_hsl(var(--foreground)/.12)] sm:-left-9 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--landing-cyan))] font-serif font-semibold text-primary">S</span>
                    <div><p className="text-xs uppercase tracking-[.14em] text-muted-foreground">A whole person</p><p className="mt-0.5 font-semibold">Seen before she serves</p></div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border bg-muted/65 px-5 py-14 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
            <Reveal><Eyebrow>The question behind the work</Eyebrow></Reveal>
            <Reveal className="[animation-delay:.1s]">
              <p className="max-w-4xl font-serif text-2xl leading-tight tracking-[-.04em] sm:text-3xl">
                Churches are full of people ready to contribute. The hard part is slowing down long enough to discover how.
              </p>
            </Reveal>
          </div>
        </section>

         <section id="how-it-works" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <Reveal><Eyebrow>Why churches need a clearer view</Eyebrow></Reveal>
              <Reveal className="[animation-delay:.1s]">
                <div>
                  <h2 className="max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                    Your church already has people God has equipped.
                  </h2>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                    The challenge is discovering where they fit.
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal className="mt-16">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {problemCards.map(([title, description], index) => (
                  <article key={title} className="landing-card flex min-h-[250px] flex-col rounded-[1.5rem] border border-border bg-card p-7">
                    <span className="text-xs font-bold tracking-[.15em] text-secondary">0{index + 1}</span>
                    <h3 className="mt-auto font-serif text-2xl leading-tight tracking-[-.04em]">{title}</h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
                  </article>
                ))}
              </div>
            </Reveal>
            <p className="mt-10 max-w-3xl font-serif text-2xl leading-tight tracking-[-.04em] sm:text-3xl">Every Part gives your church a pathway from discovery to meaningful ministry.</p>
            <Reveal className="mt-10 max-w-3xl">
              <ScriptureCallout
                verse="God has placed the parts in the body, every one of them, just as he wanted them to be."
                reference="1 Corinthians 12:18"
              />
            </Reveal>

            <div className="mt-24 grid gap-8 lg:grid-cols-[1fr_.72fr] lg:items-end">
              <Reveal>
                <h2 className="max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                  A Prayerful Pathway to Meaningful Ministry
                </h2>
              </Reveal>
              <Reveal className="[animation-delay:.12s]">
                <p className="max-w-md text-lg leading-8 text-muted-foreground">
                  Every Part keeps technology in its proper place: helping people and leaders prepare for the conversations that technology cannot have for them.
                </p>
              </Reveal>
            </div>

            <div className="mt-14 grid gap-x-3 gap-y-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-2">
              {pathway.map((step, index) => (
                <Reveal key={step.title} className={index > 2 ? "[animation-delay:.08s]" : ""}>
                  <PuzzlePiece
                    tone={(["navy", "teal", "sage", "gold", "teal", "navy"] as const)[index]}
                    variant={index % 2 === 0 ? "forward" : "reverse"}
                    className="landing-card group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold tracking-[.15em] text-muted-foreground">{step.number}</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--puzzle-wash))] text-[hsl(var(--puzzle-line))] transition group-hover:bg-secondary group-hover:text-secondary-foreground">
                        <step.icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mx-auto mt-7 max-w-[12rem] text-center font-serif text-3xl font-semibold tracking-[-.05em]">{step.title}</h3>
                    <p className="mx-auto mt-3 max-w-[15rem] text-center text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </PuzzlePiece>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-12 max-w-3xl">
              <ScriptureCallout
                verse="Each of you should use whatever gift you have received to serve others."
                reference="1 Peter 4:10"
              />
            </Reveal>
          </div>
        </section>

        <section id="ministry-profile" className="scroll-mt-24 border-y border-border bg-muted/60 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-24">
              <Reveal>
                <Eyebrow>The Ministry Profile</Eyebrow>
                <h2 className="mt-6 max-w-xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                  Discover the Whole Person
                </h2>
                <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
                  A Ministry Profile gathers a fuller picture of someone’s story. It gives a person language for what they are noticing and gives a leader a gracious place to begin.
                </p>
                <p className="mt-6 max-w-xl border-l-2 border-secondary pl-5 font-serif text-xl leading-8 tracking-[-.025em]">
                  The profile starts the conversation. Prayer, relationship, and discernment help determine the next step.
                </p>
                <ScriptureCallout
                  verse="We have different gifts, according to the grace given to each of us."
                  reference="Romans 12:6"
                />
              </Reveal>

              <Reveal className="[animation-delay:.12s]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {dimensions.map(([title, description], index) => (
                    <article key={title} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex gap-4">
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--landing-cyan))] text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                        <div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
                      </div>
                    </article>
                  ))}
                </div>
                <a href="#sample-profile" className="landing-focus mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-secondary hover:text-secondary">
                  View Sample Profile <ArrowUpRight className="h-4 w-4" />
                </a>
              </Reveal>
            </div>

            <Reveal className="mt-16">
              <div id="sample-profile" className="grid scroll-mt-24 overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-[.76fr_1.24fr]">
                <div className="relative overflow-hidden bg-[hsl(var(--primary-deep))] p-8 text-primary-foreground sm:p-12">
                  <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full border-[36px] border-[hsl(var(--accent)/.8)]" aria-hidden="true" />
                  <p className="relative text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--landing-cyan))]">Fictional sample profile</p>
                  <div className="relative mt-20 flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-serif text-2xl font-semibold text-secondary-foreground">S</span>
                    <div><h3 className="font-serif text-3xl tracking-[-.05em]">Sarah’s Ministry Profile</h3><p className="mt-1 text-sm text-[hsl(var(--landing-slate))]">Fictional example</p></div>
                  </div>
                  <p className="relative mt-10 max-w-sm text-base leading-7 text-[hsl(var(--landing-light-text))]">
                    Sarah’s Ministry Profile is a fictional example of how a fuller conversation can begin.
                  </p>
                </div>
                <div className="p-8 sm:p-12">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">What a leader might notice</p><h3 className="mt-3 font-serif text-3xl tracking-[-.045em]">Start with a question.</h3></div>
                    <HeartHandshake className="hidden h-8 w-8 shrink-0 text-secondary sm:block" />
                  </div>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Top spiritual gifts</p><div className="mt-3 flex flex-wrap gap-2">{["Encouragement", "Mercy", "Helps"].map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">{item}</span>)}</div></div>
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">APEST contribution</p><p className="mt-3 font-semibold">Shepherd</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">How she tends to operate</p><div className="mt-3 flex flex-wrap gap-2">{["Relational", "Reflective", "Organized", "People-centered"].map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">{item}</span>)}</div></div>
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Passions</p><div className="mt-3 flex flex-wrap gap-2">{["Young Adults", "People in Crisis", "New Believers"].map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">{item}</span>)}</div></div>
                  </div>
                  <div className="mt-9 space-y-4">
                    {[
                      "Sarah may bring a gift for encouragement and organization.",
                      "Her current availability makes a weekly mentoring role worth exploring.",
                      "A leader can ask what support would help her take a healthy next step.",
                    ].map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-6">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-secondary" /><span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 border-t border-border pt-6"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Possible ministry environments</p><div className="mt-3 flex flex-wrap gap-2">{["Care Ministry", "Discipleship", "Small Groups", "Hospitality"].map((item) => <span key={item} className="rounded-full border border-secondary/30 px-3 py-1.5 text-xs font-semibold text-secondary">{item}</span>)}</div></div>
                  <div className="mt-9 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
                    Sarah’s profile does not decide for her. It helps a pastor enter the conversation prepared to listen.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="for-churches" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <Reveal>
                <Eyebrow>For churches</Eyebrow>
                <h2 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                  See Your Church Differently
                </h2>
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

            <Reveal className="mt-16">
              <div className="grid gap-8 rounded-[1.75rem] border border-border bg-muted p-7 sm:p-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Matching, with humility</p>
                  <h3 className="mt-4 font-serif text-3xl tracking-[-.045em] sm:text-4xl">A guide for discernment, never a verdict.</h3>
                </div>
                <div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Current matching is advisory and rule-based. It surfaces places to begin exploring from the information people share; leaders and members make the decision together. Advanced AI matching is <span className="font-semibold text-foreground">Coming Soon</span>.
                  </p>
                  <p className="mt-5 flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4 text-secondary" /> People remain at the center of the process.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border bg-[hsl(var(--primary-deep))] px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-24">
            <Reveal>
              <Eyebrow light>Trust &amp; privacy</Eyebrow>
               <h2 className="mt-6 max-w-2xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">Your People Matter. Their Information Does Too.</h2>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[hsl(var(--landing-light-text))]">
                 Every Part uses church-controlled access and permission-based leader access to support responsible handling of member information. Profiles are designed to protect sensitive profile information and give leaders secure accounts for the ministry conversations their church chooses to have.
              </p>
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

        <section className="px-5 py-24 sm:px-8 lg:py-36">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-secondary px-7 py-16 text-center text-secondary-foreground sm:px-14 sm:py-20">
              <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full border-[28px] border-secondary-foreground/10" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-24 -right-12 h-64 w-64 rounded-full border-[32px] border-secondary-foreground/10" aria-hidden="true" />
               <p className="relative text-xs font-bold uppercase tracking-[.2em]">Begin with one conversation</p>
               <ScriptureCallout
                 verse="Now you are the body of Christ, and each one of you is a part of it."
                 reference="1 Corinthians 12:27"
                 dark
               />
                <h2 className="relative mx-auto mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">There are people in your church God has already equipped to serve.</h2>
               <p className="relative mx-auto mt-6 max-w-xl text-base leading-7 text-secondary-foreground/80 sm:text-lg">Some know exactly where they belong. Others are still trying to discover their part.</p>
               <p className="relative mx-auto mt-4 max-w-xl font-serif text-2xl leading-tight sm:text-3xl">Help every part of the Body find its place.</p>
              <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" className="landing-focus inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent">Try Every Part <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/profile/riverstone-community" className="landing-focus inline-flex items-center justify-center rounded-full border border-secondary-foreground/30 px-7 py-4 font-semibold transition hover:bg-secondary-foreground/10">Preview a Ministry Profile</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="landing-focus inline-flex rounded-xl" aria-label="Every Part home"><Brand compact /></Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Helping churches notice, name, and nurture the part every person has to play.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <a href="#how-it-works" className="landing-focus landing-link rounded-md">How It Works</a>
            <a href="#ministry-profile" className="landing-focus landing-link rounded-md">Ministry Profile</a>
            <a href="#for-churches" className="landing-focus landing-link rounded-md">For Churches</a>
            <Link href="/pricing" className="landing-focus landing-link rounded-md" data-testid="link-home-footer-pricing">Pricing</Link>
            <Link href="/sign-in" className="landing-focus landing-link rounded-md">Login</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
          <span>Every Part</span>
          <span>Made for the work of helping people serve well.</span>
        </div>
      </footer>
    </div>
  );
}