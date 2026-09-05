import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, ChevronRight, Heart, Puzzle } from "lucide-react";
import { PublicLayout, Reveal, Eyebrow, ScriptureCallout } from "@/components/public-layout";
import { sampleProfiles } from "@/data/public-content";
import { PuzzleCluster } from "@/components/puzzle-cluster";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appPath = (path: string) => `${basePath}${path}`;

export default function Home() {
  return (
    <PublicLayout 
      title="Every Part | Help people discover their part" 
      description="Every Part helps churches prayerfully discover how God has shaped their people and prepare for meaningful ministry conversations."
    >
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
                 <Link href="/sign-up" className="landing-focus inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-[0_14px_30px_hsl(var(--foreground)/.16)] transition hover:-translate-y-0.5 hover:bg-accent">
                  Try Every Part <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/how-it-works" className="landing-focus inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-7 py-4 font-semibold transition hover:border-secondary hover:text-secondary">
                  See How It Works <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal className="[animation-delay:.35s]">
              <Link
                href="/partfinder"
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
              </Link>
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
            <Link href="/ministry-profiles" className="landing-focus mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-secondary hover:text-secondary">
              Explore profiles in detail <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
        <div className="profile-banner mt-7" aria-label="Sample Ministry Profiles">
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
              <div className="mt-10">
                <Link href="/why-every-part" className="landing-focus inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10">
                  Read more about our philosophy <ArrowRight className="h-4 w-4" />
                </Link>
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
            <p className="relative mt-6 text-xs font-semibold uppercase tracking-[.14em] text-secondary-foreground/65">
              Free to start · paid plans from $10/mo
            </p>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
