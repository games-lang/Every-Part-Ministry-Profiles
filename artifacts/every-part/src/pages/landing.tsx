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
  Puzzle,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { BetaNotice } from "@/components/beta-notice";
import { PuzzleCluster } from "@/components/puzzle-cluster";
import { PublicAiAssistant } from "@/components/public-ai-assistant";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appPath = (path: string) => `${basePath}${path}`;

const pathway = [
  {
    number: "01",
    icon: Cross,
    title: "Pray",
    description:
      "Begin with prayer. Ask God to help you see people as he sees them, not simply as open positions to fill.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Set Up",
    description:
      "Shape a Ministry Profile around your church, your teams, and the places people can meaningfully contribute.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Discover",
    description:
      "Invite people to reflect on their story, gifts, passions, experience, rhythms, and the way they are growing.",
  },
  {
    number: "04",
    icon: Compass,
    title: "Discern",
    description:
      "Use the profile as a doorway into a real conversation about calling, readiness, capacity, and the season someone is in.",
  },
  {
    number: "05",
    icon: Network,
    title: "Connect",
    description:
      "Explore ministry opportunities together and find a place where a person and a team can serve one another well.",
  },
  {
    number: "06",
    icon: Orbit,
    title: "Develop",
    description:
      "Follow up after someone begins. Notice what is healthy, encourage growth, and make room for the next step.",
  },
];

const dimensions = [
  ["Spiritual Gifts", "How has the Holy Spirit equipped me?"],
  ["How You Minister", "How do I tend to contribute to the mission of the Church?"],
  ["How You Tend to Operate", "How do I naturally relate, decide, organize, and work with others?"],
  ["Passions", "Who or what has God placed on my heart?"],
  ["Skills & Experience", "What has God already developed in me?"],
  ["Spiritual Health", "How am I doing in my relationship with Christ?"],
  ["Availability & Current Season", "What commitment is realistic and healthy right now?"],
  ["Ministry Interests", "Where am I drawn toward serving?"],
];

const problemCards = [
  ["The Same People Keep Carrying the Load", "Faithful volunteers often carry most of the ministry load while other gifts and abilities remain unseen."],
  ["Good Intentions Need a Starting Point", "Many people are willing to serve, but leaders and members are unsure where a healthy conversation should begin."],
  ["People and Seasons Change", "A role that once fit may not match someone’s gifts, capacity, or current season anymore."],
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
  "Follow development over time",
];

const partfinderBenefits = [
  {
    eyebrow: "For pastors",
    title: "Prepare for the conversations that matter.",
    description:
      "PartFinder helps pastors see patterns across adult Ministry Profiles, think through a ministry need, and enter a conversation with better questions.",
    points: [
      "Explore church-wide serving patterns",
      "Notice people worth following up with",
      "Prepare thoughtful leadership conversations",
    ],
  },
  {
    eyebrow: "For volunteer coordinators",
    title: "Move from a ministry need to a thoughtful next step.",
    description:
      "Describe the kind of help your team needs and PartFinder surfaces relevant, verified profile signals so you know where to begin exploring.",
    points: [
      "Clarify the role, rhythms, and availability",
      "Review possible connections from shared evidence",
      "Keep willingness and relationship at the center",
    ],
  },
];

const sampleProfiles = [
  {
    name: "Sarah",
    pathway: "Adult Ministry Profile",
    age: "In conversation",
    initials: "S",
    description: "Encouragement, care, and a thoughtful next step.",
    theme: "adult",
    image: "/sample-profile-sarah-community.jpg",
  },
  {
    name: "Leah",
    pathway: "Discover Profile",
    age: "Ages 6–8",
    initials: "L",
    description: "Noticing joy, kindness, and the ways she helps.",
    theme: "discover",
  },
  {
    name: "Marcus",
    pathway: "Explore Profile",
    age: "Ages 9–12",
    initials: "M",
    description: "Exploring curiosity, courage, and what matters to him.",
    theme: "explore",
  },
  {
    name: "Jordan",
    pathway: "Develop Profile",
    age: "Ages 13–17",
    initials: "J",
    description: "Growing gifts, meaningful interests, and a next step.",
    theme: "develop",
  },
];

const sampleProfileDetails = [
  {
    name: "Sarah",
    pathway: "Adult Ministry Profile",
    age: "In conversation",
    initials: "S",
    theme: "adult",
    image: "/sample-profile-sarah-community.jpg",
    intro: "A fuller picture before the next conversation.",
    lead: "Start with a question.",
    fields: [
      { label: "Top spiritual gifts", values: ["Encouragement", "Mercy", "Helps"] },
      { label: "How she tends to minister", text: "Caring for people over time" },
      { label: "How she tends to operate", values: ["Relational", "Reflective", "Organized", "People-centered"] },
      { label: "Passions", values: ["Young Adults", "People in Crisis", "New Believers"] },
    ],
    notes: [
      "Sarah may bring a gift for encouragement and organization.",
      "Her current availability makes a weekly mentoring role worth exploring.",
      "A leader can ask what support would help her take a healthy next step.",
    ],
    environments: ["Care Ministry", "Discipleship", "Small Groups", "Hospitality"],
    closing: "Sarah’s profile does not decide for her. It helps a pastor enter the conversation prepared to listen.",
  },
  {
    name: "Leah",
    pathway: "Discover Profile",
    age: "Ages 6–8",
    initials: "L",
    theme: "discover",
    intro: "A gentle way to notice how a child is growing and helping.",
    lead: "Notice what brings her joy.",
    fields: [
      { label: "Things she enjoys", values: ["Making things", "Stories", "Singing"] },
      { label: "How she might help", text: "Welcoming people and noticing who needs care" },
      { label: "What grown-ups notice", values: ["Kind", "Curious", "Quick to encourage"] },
      { label: "A next conversation", values: ["Where she feels brave", "Who helps her grow"] },
    ],
    notes: [
      "Leah seems energized when she can make someone feel included.",
      "Her answers give a trusted grown-up a starting point, not a label.",
      "A leader can invite her to try a small, supported way to help.",
    ],
    environments: ["Kids Welcome", "Worship Arts", "Small Groups", "Helping a Friend"],
    closing: "Leah’s profile gives adults better questions to ask while leaving room for play, growth, and her own words.",
  },
  {
    name: "Marcus",
    pathway: "Explore Profile",
    age: "Ages 9–12",
    initials: "M",
    theme: "explore",
    intro: "A snapshot of the questions, strengths, and interests he is exploring.",
    lead: "Follow the curiosity.",
    fields: [
      { label: "Strengths showing up", values: ["Creative", "Courageous", "Encouraging"] },
      { label: "How he tends to contribute", text: "Bringing energy and ideas to a group" },
      { label: "How he tends to operate", values: ["Imaginative", "Collaborative", "Adventurous", "Observant"] },
      { label: "Interests to explore", values: ["Media", "Games", "Welcome", "Helping younger kids"] },
    ],
    notes: [
      "Marcus may thrive when he can ask questions and help shape the idea.",
      "He appears ready for responsibility that comes with a clear, supportive guide.",
      "A leader can ask which part he would most like to try first.",
    ],
    environments: ["Tech & Media", "Kids Ministry", "Welcome Team", "Creative Projects"],
    closing: "Marcus’s profile creates a safe starting point for trying something meaningful without rushing him into a role.",
  },
  {
    name: "Jordan",
    pathway: "Develop Profile",
    age: "Ages 13–17",
    initials: "J",
    theme: "develop",
    intro: "A reflection on growing gifts, meaningful interests, and a next step.",
    lead: "Make room for the next step.",
    fields: [
      { label: "Gifts to explore", values: ["Leadership", "Wisdom", "Service"] },
      { label: "How Jordan tends to minister", text: "Building trust and taking thoughtful initiative" },
      { label: "How Jordan tends to operate", values: ["Reflective", "Collaborative", "Determined", "People-aware"] },
      { label: "Passions", values: ["Students", "Justice", "Prayer", "Belonging"] },
    ],
    notes: [
      "Jordan may be ready to lead a small piece of ministry with coaching nearby.",
      "The profile points toward a conversation about capacity, support, and timing.",
      "A leader can ask what kind of responsibility would feel like a healthy stretch.",
    ],
    environments: ["Student Leadership", "Prayer", "Mentoring", "Service Projects"],
    closing: "Jordan’s profile supports a real development conversation—one that honors both calling and the season Jordan is in.",
  },
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

  useEffect(() => {
    document.title = "Every Part | Help people discover their part";
    const description =
      "Every Part helps churches prayerfully discover how God has shaped their people and prepare for meaningful ministry conversations.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, []);

  return (
    <>
      <div className="ep-landing min-h-[100dvh] overflow-x-hidden">
      <BetaNotice />
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href={appPath("/")} className="landing-focus rounded-xl" aria-label="Every Part home" onClick={closeMenu}>
            <Brand />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="landing-focus landing-link rounded-md px-1 py-2">How It Works</a>
            <a href="#ministry-profile" className="landing-focus landing-link rounded-md px-1 py-2">Ministry Profile</a>
            <a href="#partfinder" className="landing-focus landing-link rounded-md px-1 py-2">PartFinder</a>
            <a href="#for-churches" className="landing-focus landing-link rounded-md px-1 py-2">For Churches</a>
            <Link href={appPath("/pricing")} className="landing-focus landing-link rounded-md px-1 py-2" data-testid="link-home-pricing">Pricing</Link>
            <Link href={appPath("/sign-in")} className="landing-focus landing-link rounded-md px-1 py-2">Leader sign in</Link>
            <Link href={appPath("/sign-up")} className="landing-focus ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent">
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
              <a href="#partfinder" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">PartFinder</a>
              <a href="#for-churches" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">For Churches</a>
               <Link href={appPath("/pricing")} onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-home-mobile-pricing">Pricing</Link>
                <Link href={appPath("/sign-in")} onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">Leader sign in</Link>
               <Link href={appPath("/sign-up")} onClick={closeMenu} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Try Every Part <ArrowRight className="h-4 w-4" /></Link>
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
                  <span className="text-accent">EVERY</span> PERSON HAS A{" "}
                  <span className="text-accent">PART.</span>{" "}
                  HELP THEM DISCOVER IT.
                </h1>
              </Reveal>
              <Reveal className="[animation-delay:.2s]">
                <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                   Every Part helps pastors slow down and discover how God has shaped each person—so the next ask is prayerful, not a guess.
                </p>
                 <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                   Discover the gifts, passions, calling, ministry potential, and availability of your people—and help connect them with a place to serve and grow.
                 </p>
                 <p className="mt-5 max-w-xl border-l-2 border-secondary pl-4 text-base font-medium leading-7 text-foreground sm:text-lg">
                   Not a volunteer schedule. A prepared conversation before you ask someone to serve.
                 </p>
              </Reveal>
              <Reveal className="[animation-delay:.3s]">
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                   <Link href={appPath("/sign-up")} className="landing-focus inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-[0_14px_30px_hsl(var(--foreground)/.16)] transition hover:-translate-y-0.5 hover:bg-accent">
                    Try Every Part <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#how-it-works" className="landing-focus inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-7 py-4 font-semibold transition hover:border-secondary hover:text-secondary">
                    See How It Works <ChevronDown className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>
              <Reveal className="[animation-delay:.35s]">
                <a
                  href="#partfinder"
                  className="landing-focus mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-secondary/35 bg-secondary/10 p-4 transition hover:border-secondary hover:bg-secondary/15"
                  data-testid="link-hero-partfinder"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Puzzle className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-accent">Meet PartFinder</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">An AI-assisted guide for pastors and volunteer coordinators.</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-secondary" />
                </a>
              </Reveal>
              <Reveal className="[animation-delay:.4s]">
                <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--landing-cyan))] text-primary"><Heart className="h-4 w-4" /></span>
                    <span>A starting point for the next ministry conversation—not just a spiritual gifts test.</span>
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
                  <div className="relative z-10 flex items-center gap-4 py-6">
                    <img
                      src={appPath("/sample-profile-sarah-community.jpg")}
                      alt="Sarah, a fictional example profile participant"
                      className="h-16 w-16 shrink-0 rounded-full border-2 border-secondary/70 object-cover shadow-lg"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Sarah’s story</p>
                      <p className="mt-1 text-xs leading-5 text-[hsl(var(--landing-slate))]">
                        A fuller picture before the next conversation.
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 pb-8 sm:pb-12">
                    <p className="text-sm text-[hsl(var(--landing-slate))]">A question worth asking</p>
                    <p className="mt-4 max-w-sm font-serif text-3xl leading-[1.05] tracking-[-.055em] sm:text-4xl">
                      Where do you notice God giving you energy to help others?
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border bg-card/60 py-10 sm:py-12" aria-labelledby="sample-profiles-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Eyebrow>One church. Many stories.</Eyebrow>
                  <h2 id="sample-profiles-heading" className="mt-3 font-serif text-3xl font-medium tracking-[-.045em] sm:text-4xl">
                    A fuller picture of every part.
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Adult, Discover, Explore, and Develop give each person a fitting place to reflect and grow.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="profile-banner" aria-label="Sample Ministry Profiles">
            <div className="profile-banner__viewport">
              <div className="profile-banner__track">
                {[...sampleProfiles, ...sampleProfiles].map((profile, index) => (
                  <div
                    key={`${profile.name}-${index}`}
                    className={`profile-banner__card profile-banner__card--${profile.theme}`}
                    aria-hidden={index >= sampleProfiles.length}
                  >
                    {profile.image ? (
                      <img
                        src={appPath(profile.image)}
                        alt=""
                        className="profile-banner__avatar profile-banner__avatar--photo"
                      />
                    ) : (
                      <span className="profile-banner__avatar" aria-hidden="true">{profile.initials}</span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{profile.name}</p>
                        <span className="profile-banner__dot" aria-hidden="true" />
                        <p className="truncate text-xs font-medium text-muted-foreground">{profile.age}</p>
                      </div>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-[hsl(var(--banner-accent))]">{profile.pathway}</p>
                      <p className="mt-2 max-w-[19rem] text-sm leading-5 text-muted-foreground">{profile.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

         <section className="border-y border-border bg-primary px-5 py-20 text-primary-foreground sm:px-8 lg:py-28">
           <div className="mx-auto max-w-5xl">
             <Reveal>
               <div className="mx-auto max-w-4xl">
                 <Eyebrow light>Why every part matters</Eyebrow>
                 <blockquote className="mt-8 border-l-2 border-secondary pl-6 font-serif text-3xl leading-[1.04] tracking-[-.045em] sm:pl-8 sm:text-5xl lg:text-6xl">
                   “Just as a body, though one, has many parts, but all its many parts form one body, so it is with Christ.”
                 </blockquote>
                 <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[hsl(var(--landing-slate))]">
                   — 1 Corinthians 12:12 <span className="ml-2 font-medium opacity-70">NIV</span>
                 </p>
                 <p className="mt-8 max-w-2xl text-lg leading-8 text-[hsl(var(--landing-light-text))]">
                   Every Part is built around this picture: a church is not a collection of disconnected roles, but one body with many meaningful parts.
                 </p>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {problemCards.map(([title, description], index) => (
                  <article key={title} className="landing-card flex min-h-[250px] flex-col rounded-[1.5rem] border border-border bg-card p-7">
                    <span className="text-xs font-bold tracking-[.15em] text-secondary">0{index + 1}</span>
                    <h3 className="mt-auto font-serif text-2xl leading-tight tracking-[-.04em]">{title}</h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
                  </article>
                ))}
              </div>
            </Reveal>
             <Reveal className="mt-10 max-w-4xl">
               <div className="rounded-[1.5rem] border border-secondary/35 bg-secondary/10 p-7 sm:p-8">
                 <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Built for conversation</p>
                 <p className="mt-3 max-w-3xl font-serif text-2xl leading-tight tracking-[-.04em] sm:text-3xl">
                   Every Part gives your church a pathway from discovery to meaningful ministry—possibilities, not decisions.
                 </p>
                 <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                   It does not assign volunteers. Prayer, relationship, discernment, and a real conversation still shape the next step.
                 </p>
               </div>
             </Reveal>
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

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pathway.map((step, index) => (
                <Reveal key={step.title} className={index > 2 ? "[animation-delay:.08s]" : ""}>
                  <article className="landing-card group flex min-h-[270px] flex-col rounded-[1.5rem] border border-border bg-card p-7 sm:p-8">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold tracking-[.15em] text-muted-foreground">{step.number}</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary transition group-hover:bg-secondary group-hover:text-secondary-foreground">
                        <step.icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-auto pt-16 font-serif text-3xl font-semibold tracking-[-.05em]">{step.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </article>
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

            <div id="sample-profile" className="scroll-mt-24">
              <Reveal className="mt-16">
                <div className="mb-8 max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Four fictional sample profiles</p>
                  <h3 className="mt-3 font-serif text-3xl tracking-[-.045em] sm:text-4xl">See how each pathway starts a different conversation.</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    These examples show the kind of reflection each profile can surface. They offer possibilities and questions—not labels, conclusions, or automatic placements.
                  </p>
                </div>
              </Reveal>
              <div className="grid gap-6 lg:grid-cols-2">
                {sampleProfileDetails.map((profile, index) => (
                  <Reveal key={profile.name} className={index % 2 ? "[animation-delay:.08s]" : ""}>
                    <article className={`sample-profile-card sample-profile-card--${profile.theme}`}>
                      <div className="sample-profile-card__header">
                        <div className="relative z-10 flex items-center gap-4">
                          {profile.image ? (
                            <img
                              src={appPath(profile.image)}
                              alt={`${profile.name}, a fictional example profile participant`}
                              className="h-16 w-16 shrink-0 rounded-full border-2 border-white/60 object-cover shadow-lg"
                            />
                          ) : (
                            <span className="sample-profile-card__avatar" aria-hidden="true">{profile.initials}</span>
                          )}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">{profile.pathway} · {profile.age}</p>
                            <h4 className="mt-1 font-serif text-2xl tracking-[-.04em] text-white">{profile.name}’s profile</h4>
                          </div>
                        </div>
                        <p className="relative z-10 mt-6 max-w-md text-sm leading-6 text-white/78">{profile.intro}</p>
                      </div>
                      <div className="flex h-full flex-col p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="sample-profile-card__eyebrow">What a leader might notice</p>
                            <h4 className="mt-2 font-serif text-2xl tracking-[-.035em]">{profile.lead}</h4>
                          </div>
                          <HeartHandshake className="h-6 w-6 shrink-0 text-[hsl(var(--sample-accent))]" />
                        </div>
                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                          {profile.fields.map((field) => (
                            <div key={field.label}>
                              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">{field.label}</p>
                              {"values" in field ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {field.values?.map((item) => <span key={item} className="sample-profile-card__tag">{item}</span>)}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm font-semibold leading-5">{field.text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-7 space-y-3 border-t border-border pt-6">
                          {profile.notes.map((item) => (
                            <div key={item} className="flex gap-3 text-sm leading-6">
                              <Check className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--sample-accent))]" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-7 border-t border-border pt-6">
                          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Possible ministry environments</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {profile.environments.map((item) => <span key={item} className="sample-profile-card__environment">{item}</span>)}
                          </div>
                        </div>
                        <p className="mt-auto border-t border-border pt-6 text-sm leading-6 text-muted-foreground">{profile.closing}</p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

         <section id="partfinder" className="scroll-mt-24 border-y border-border bg-[hsl(var(--primary-deep))] px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
           <div className="mx-auto max-w-7xl">
             <div className="grid gap-10 lg:grid-cols-[.84fr_1.16fr] lg:items-end">
               <Reveal>
                 <Eyebrow light>Meet PartFinder</Eyebrow>
                 <h2 className="mt-6 max-w-2xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                   A clearer starting point for the next ministry conversation.
                 </h2>
               </Reveal>
               <Reveal className="[animation-delay:.1s]">
                 <div className="max-w-2xl">
                   <div className="flex items-center gap-3 text-secondary">
                     <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                       <Puzzle className="h-5 w-5" />
                     </span>
                     <p className="text-sm font-semibold uppercase tracking-[.14em]">AI-assisted ministry discovery</p>
                   </div>
                   <p className="mt-6 text-lg leading-8 text-[hsl(var(--landing-light-text))]">
                     PartFinder helps pastors and volunteer coordinators turn a ministry question into a thoughtful place to begin. Ask about a need, explore structured profile signals, and prepare for a real conversation with a real person.
                   </p>
                 </div>
               </Reveal>
             </div>

             <div className="mt-14 grid gap-4 lg:grid-cols-2">
               {partfinderBenefits.map((benefit, index) => (
                 <Reveal key={benefit.eyebrow} className={index ? "[animation-delay:.1s]" : ""}>
                   <article className="h-full rounded-[1.75rem] border border-white/15 bg-white/[.07] p-7 sm:p-9">
                     <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[hsl(var(--landing-cyan))]">{benefit.eyebrow}</p>
                     <h3 className="mt-6 max-w-lg font-serif text-3xl leading-[1.03] tracking-[-.05em] sm:text-4xl">{benefit.title}</h3>
                     <p className="mt-5 max-w-xl text-sm leading-7 text-[hsl(var(--landing-light-text))]">{benefit.description}</p>
                     <ul className="mt-7 grid gap-3 text-sm text-[hsl(var(--landing-light-text))]">
                       {benefit.points.map((point) => (
                         <li key={point} className="flex gap-3">
                           <Check className="mt-1 h-4 w-4 shrink-0 text-secondary" />
                           <span>{point}</span>
                         </li>
                       ))}
                     </ul>
                   </article>
                 </Reveal>
               ))}
             </div>

             <Reveal className="mt-10">
               <div className="grid gap-7 rounded-[1.75rem] border border-secondary/35 bg-secondary/10 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
                 <div>
                   <p className="text-xs font-bold uppercase tracking-[.18em] text-secondary">People remain at the center</p>
                   <p className="mt-3 max-w-3xl font-serif text-2xl leading-tight tracking-[-.035em] sm:text-3xl">
                     PartFinder offers possibilities, not decisions.
                   </p>
                   <p className="mt-4 max-w-3xl text-sm leading-7 text-[hsl(var(--landing-light-text))]">
                     It does not assign volunteers, decide readiness, declare a calling, or replace personal conversation, prayer, screening, or safeguarding.
                   </p>
                 </div>
                 <Link href={appPath("/sign-up")} className="landing-focus inline-flex items-center justify-center gap-3 rounded-full bg-secondary px-6 py-3.5 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90">
                   Bring PartFinder to your church <ArrowRight className="h-4 w-4" />
                 </Link>
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
                  <Link href={appPath("/sign-up")} className="landing-focus mt-10 inline-flex items-center gap-3 rounded-full bg-secondary px-6 py-3.5 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90">
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
                     PartFinder can help leaders explore a ministry need using structured profile signals and verified evidence. It surfaces places to begin exploring; leaders and members make the decision together.
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
                <Link href={appPath("/sign-up")} className="landing-focus inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent">Try Every Part <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/profile/riverstone-community" className="landing-focus inline-flex items-center justify-center rounded-full border border-secondary-foreground/30 px-7 py-4 font-semibold transition hover:bg-secondary-foreground/10">Preview a Ministry Profile</Link>
              </div>
               <p className="relative mt-6 text-xs font-semibold uppercase tracking-[.14em] text-secondary-foreground/65">
                 Free to start · paid plans from $10/mo
               </p>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href={appPath("/")} className="landing-focus inline-flex rounded-xl" aria-label="Every Part home"><Brand compact /></Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Helping churches notice, name, and nurture the part every person has to play.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <a href="#how-it-works" className="landing-focus landing-link rounded-md">How It Works</a>
            <a href="#ministry-profile" className="landing-focus landing-link rounded-md">Ministry Profile</a>
            <a href="#partfinder" className="landing-focus landing-link rounded-md">PartFinder</a>
            <a href="#for-churches" className="landing-focus landing-link rounded-md">For Churches</a>
            <Link href="/pricing" className="landing-focus landing-link rounded-md" data-testid="link-home-footer-pricing">Pricing</Link>
            <Link href="/about-early-access" className="landing-focus landing-link rounded-md">About Early Access</Link>
            <Link href="/sign-in" className="landing-focus landing-link rounded-md">Leader sign in</Link>
             <Link href="/privacy" className="landing-focus landing-link rounded-md" data-testid="link-home-footer-privacy">Privacy Policy</Link>
             <Link href="/terms" className="landing-focus landing-link rounded-md" data-testid="link-home-footer-terms">Terms of Service</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
          <span>Every Part</span>
          <span>Made for the work of helping people serve well.</span>
        </div>
      </footer>
      </div>
      <PublicAiAssistant />
    </>
  );
}