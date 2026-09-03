import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Cross,
  Menu,
  Network,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { PuzzleCluster } from "@/components/puzzle-cluster";
import { useGetBillingPlans } from "@workspace/api-client-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    eyebrow: "Begin gently",
    profileLimit: "5",
    limitLabel: "Ministry Profiles",
    aiCredits: "20 AI credits each month",
    price: "$0",
    cadence: "per month",
    description: "A simple place to begin exploring Every Part with your church.",
    icon: Cross,
    tone: "light",
    valueNote: "No card required",
    action: "Start here",
    href: "/sign-up",
  },
  {
    id: "growing",
    name: "Growing",
    eyebrow: "Start small",
    profileLimit: "50",
    limitLabel: "Ministry Profiles",
    aiCredits: "150 AI credits each month",
    price: "$10",
    cadence: "per month",
    description: "For a small team beginning a shared ministry conversation.",
    icon: Sparkles,
    tone: "light",
    valueNote: "Secure monthly billing",
    action: "Explore Growing",
    href: "/sign-up",
  },
  {
    id: "complete",
    name: "Complete",
    eyebrow: "See the whole church",
    profileLimit: "100",
    limitLabel: "Ministry Profiles",
    aiCredits: "400 AI credits each month",
    price: "$20",
    cadence: "per month",
    description: "For churches ready to build a fuller rhythm of discovery, connection, and development.",
    icon: Network,
    tone: "featured",
    valueNote: "Secure monthly billing",
    action: "Explore Complete",
    href: "/sign-up",
  },
  {
    id: "network",
    name: "Network",
    eyebrow: "Grow across churches",
    profileLimit: "250",
    limitLabel: "Ministry Profiles",
    aiCredits: "1,000 AI credits each month",
    price: "$30",
    cadence: "per month",
    description: "For multi-campus churches, networks, and denominations shaping ministry together.",
    icon: UsersRound,
    tone: "dark",
    valueNote: "Secure monthly billing",
    action: "Talk with us",
    href: "/sign-up",
  },
];

const includedBenefits = [
  ["Church setup", "Shape your church, teams, and places to serve."],
  ["Ministry Profiles", "Give people a thoughtful starting point for conversation."],
  ["Search and filtering", "Find a place to begin exploring together."],
  ["Team conversations", "Give leaders a shared starting point."],
  ["Profile history", "Return to the conversation as seasons change."],
  ["Leader access", "Invite the people who help your church discern."],
];

const faqs = [
  {
    question: "Is billing live?",
    answer:
      "Yes. Starter is free, and Growing, Complete, and Network are available as monthly subscriptions. Stripe securely handles checkout and billing management.",
  },
  {
    question: "What does Start Free include?",
    answer:
      "Starter includes up to 5 Ministry Profiles and does not require a card.",
  },
  {
    question: "What does an active profile mean?",
    answer:
      "Each completed adult or youth Ministry Profile counts toward the church’s plan limit. Existing profiles remain available if a church reaches its limit or moves to a smaller plan.",
  },
  {
    question: "Can we change plans later?",
    answer:
      "Yes. Use Manage billing in your church workspace to change or cancel your subscription securely through Stripe.",
  },
  {
    question: "How do we think about matching?",
    answer:
      "Every Part is a guide for discernment, not a verdict. Search and filtering help surface places to explore; prayer, relationship, and conversation remain central to deciding what comes next.",
  },
];

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    const element = document.querySelector(`[data-reveal="${className}"]`);
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [className]);

  return (
    <div
      data-reveal={className}
      className={`transition duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function PricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { data: billingPlans } = useGetBillingPlans();

  useEffect(() => {
    document.title = "Pricing | Every Part";
    const description =
      "Choose a monthly Every Part plan for your church.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, []);

  return (
    <div className="ep-landing min-h-[100dvh] overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="landing-focus rounded-xl"
            aria-label="Every Part home"
            data-testid="link-pricing-home"
          >
            <Brand />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Main navigation">
            <Link href="/#how-it-works" className="landing-focus landing-link rounded-md px-1 py-2" data-testid="link-pricing-how-it-works">
              How It Works
            </Link>
            <Link href="/#ministry-profile" className="landing-focus landing-link rounded-md px-1 py-2" data-testid="link-pricing-ministry-profile">
              Ministry Profile
            </Link>
            <Link href="/#for-churches" className="landing-focus landing-link rounded-md px-1 py-2" data-testid="link-pricing-for-churches">
              For Churches
            </Link>
            <Link href="/sign-in" className="landing-focus landing-link rounded-md px-1 py-2" data-testid="link-pricing-login">
              Login
            </Link>
            <Link
              href="/sign-up"
              className="landing-focus ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent"
              data-testid="link-pricing-header-start"
            >
              Begin with Every Part <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>
          <button
            type="button"
            className="landing-focus inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            data-testid="button-pricing-menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="landing-menu border-t border-border bg-background px-5 py-4 lg:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-pricing-mobile-how-it-works">How It Works</Link>
              <Link href="/#ministry-profile" onClick={() => setMenuOpen(false)} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-pricing-mobile-ministry-profile">Ministry Profile</Link>
              <Link href="/#for-churches" onClick={() => setMenuOpen(false)} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-pricing-mobile-for-churches">For Churches</Link>
              <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-pricing-mobile-login">Login</Link>
              <Link href="/sign-up" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground" data-testid="link-pricing-mobile-start">Begin with Every Part <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-primary px-5 pb-20 pt-16 text-primary-foreground sm:px-8 sm:pb-28 sm:pt-24">
          <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full border-[40px] border-secondary/25" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-10rem] left-[38%] h-80 w-80 rounded-full border-[28px] border-[hsl(var(--landing-cyan)/.18)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <Reveal className="pricing-hero-eyebrow">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--landing-cyan))]">
                <span className="h-px w-8 bg-secondary" />
                   Church plans · a clear beginning
              </div>
            </Reveal>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-24">
              <Reveal className="pricing-hero-heading">
                <h1 className="max-w-4xl font-serif text-[clamp(3.4rem,8vw,7.7rem)] font-semibold leading-[.88] tracking-[-.085em]">
                  Take the next <span className="text-secondary">faithful</span> step.
                </h1>
              </Reveal>
              <Reveal className="pricing-hero-copy">
                <p className="max-w-xl text-lg leading-8 text-[hsl(var(--landing-light-text))] sm:text-xl">
                  Every Part helps pastors and church leaders prayerfully discover how God has shaped their people—and connect them with meaningful places to serve and grow.
                </p>
                <p className="mt-6 border-l-2 border-secondary pl-5 text-sm leading-6 text-[hsl(var(--landing-slate))]">
                  Begin with the plan that fits your season. There is no pressure to decide everything today.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="relative px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="pricing-notice">
             <aside className="relative -mt-8 rounded-[1.5rem] border border-secondary/40 bg-[hsl(var(--secondary)/.12)] p-6 shadow-[0_18px_45px_hsl(var(--foreground)/.08)] sm:-mt-10 sm:flex sm:items-start sm:gap-5 sm:p-7" aria-label="Pricing notice">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <CircleHelp className="h-5 w-5" />
                </span>
                <div className="mt-4 sm:mt-0">
                   <p className="text-sm font-bold uppercase tracking-[.15em] text-accent" data-testid="text-pricing-label">Simple monthly plans</p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/80" data-testid="text-preview-pricing-notice">
                     Starter is free. Growing, Complete, and Network are monthly plans with secure Stripe checkout. Sign in to your church workspace to begin.
                  </p>
                </div>
              </aside>
            </Reveal>

            <div className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Reveal className="pricing-plans-heading">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.2em] text-accent">Choose your starting place</p>
                  <h2 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-[.96] tracking-[-.065em] sm:text-5xl">
                    A plan for the season your church is in.
                  </h2>
                </div>
              </Reveal>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground sm:text-right" data-testid="text-pricing-guidance">
                Every plan begins with the same posture: listen well, discern together, and make room for people to grow.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-4 lg:items-start">
               {plans.map((plan, index) => {
                const Icon = plan.icon;
                 const livePlan = billingPlans?.plans.find((item) => item.key === plan.id);
                 const displayPrice =
                   plan.id === "starter"
                     ? "$0"
                     : livePlan
                       ? `$${Math.round(livePlan.monthlyPrice / 100)}`
                       : plan.price;
                const featured = plan.tone === "featured";
                const dark = plan.tone === "dark";
                return (
                  <Reveal key={plan.id} className={`pricing-card-reveal-${index}`}>
                    <article
                      className={`relative flex h-full min-h-[460px] flex-col rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_hsl(var(--foreground)/.12)] sm:p-7 ${
                        featured
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_20px_50px_hsl(var(--primary)/.2)] lg:-mt-5 lg:min-h-[500px]"
                          : dark
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-card"
                      }`}
                      data-testid={`card-plan-${plan.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-secondary" : dark ? "bg-white/10 text-secondary" : "bg-muted text-primary"}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        {featured && (
                          <span className="rounded-full bg-secondary px-3 py-1.5 text-center text-[9px] font-bold uppercase tracking-[.13em] text-secondary-foreground" data-testid="badge-plan-recommended">
                            Best value
                          </span>
                        )}
                      </div>
                      {featured && <PuzzleCluster size="sm" className="pointer-events-none absolute bottom-5 right-5 opacity-10" />}
                      <p className={`mt-5 text-[10px] font-bold uppercase tracking-[.16em] ${featured || dark ? "text-[hsl(var(--landing-cyan))]" : "text-muted-foreground"}`}>
                        {featured ? "Most churches begin here" : plan.eyebrow}
                      </p>
                      <h3 className="mt-6 font-serif text-3xl font-semibold tracking-[-.055em]" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</h3>
                      <div className="mt-6 flex items-baseline gap-2">
                         <span className="font-serif text-5xl font-semibold tracking-[-.07em]" data-testid={`text-plan-price-${plan.id}`}>{displayPrice}</span>
                        <span className={`text-xs ${featured || dark ? "text-[hsl(var(--landing-slate))]" : "text-muted-foreground"}`}>{plan.cadence}</span>
                      </div>
                      <div className={`mt-5 rounded-2xl p-4 ${featured || dark ? "bg-white/10" : "bg-muted/70"}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-[.14em] ${featured || dark ? "text-[hsl(var(--landing-slate))]" : "text-muted-foreground"}`}>Includes up to</p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-serif text-4xl font-semibold tracking-[-.06em]" data-testid={`text-plan-limit-${plan.id}`}>{plan.profileLimit}</span>
                          <span className={`text-xs ${featured || dark ? "text-[hsl(var(--landing-light-text))]" : "text-muted-foreground"}`}>{plan.limitLabel}</span>
                        </div>
                      </div>
                       <p className={`mt-3 text-sm font-semibold ${featured || dark ? "text-secondary" : "text-primary"}`}>
                         {plan.aiCredits}
                       </p>
                      <p className={`mt-4 min-h-[48px] text-sm leading-6 ${featured || dark ? "text-[hsl(var(--landing-light-text))]" : "text-muted-foreground"}`}>{plan.description}</p>
                      <p className={`mt-3 text-xs font-semibold ${featured || dark ? "text-secondary" : "text-accent"}`} data-testid={`text-plan-value-${plan.id}`}>{plan.valueNote}</p>
                      <div className="mt-auto pt-8">
                        <Link
                           href={plan.id === "starter" ? plan.href : `/sign-up?plan=${plan.id}`}
                          className={`landing-focus inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${featured ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : dark ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary text-primary-foreground hover:bg-accent"}`}
                          data-testid={`link-plan-action-${plan.id}`}
                        >
                          {plan.action} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
                <p className="mt-6 text-center text-xs leading-5 text-muted-foreground" data-testid="text-pricing-footnote">
                Manage upgrades, cancellations, and payment methods anytime from your church billing page.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-muted/60 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <Reveal className="pricing-compare-label">
                <div>
                   <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-8 bg-secondary" />What every plan includes</p>
                  <Cross className="mt-8 h-8 w-8 text-secondary" />
                </div>
              </Reveal>
              <Reveal className="pricing-compare-heading">
                <div>
                   <h2 className="max-w-3xl font-serif text-4xl font-semibold leading-[.96] tracking-[-.065em] sm:text-6xl">Choose your capacity. Keep the whole conversation.</h2>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Every plan is built around the full Every Part experience. The plan you choose changes the room you have to invite people in—not the care you bring to the conversation.</p>
                </div>
              </Reveal>
            </div>

             <Reveal className="pricing-included-reveal">
               <div className="mt-14 grid gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3" data-testid="grid-plan-inclusions">
                 {includedBenefits.map(([feature, note], index) => (
                   <div key={feature} className="bg-card p-7 sm:p-8" data-testid={`card-inclusion-${index}`}>
                     <Check className="h-5 w-5 text-secondary" aria-hidden="true" />
                     <h3 className="mt-6 font-serif text-2xl font-semibold tracking-[-.04em]" data-testid={`text-inclusion-feature-${index}`}>{feature}</h3>
                     <p className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>
                   </div>
                 ))}
              </div>
                <p className="mt-6 text-sm leading-6 text-muted-foreground" data-testid="text-active-profile-definition">
                  Plan capacity, archival rules, and billing details will be handled clearly with churches before billing is enabled.
               </p>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <Reveal className="pricing-faq-heading">
              <div className="lg:sticky lg:top-32">
                <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-8 bg-secondary" />A few honest answers</p>
                <h2 className="mt-6 max-w-xl font-serif text-4xl font-semibold leading-[.96] tracking-[-.065em] sm:text-6xl">Questions worth asking before you begin.</h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">We would rather be clear about what is still taking shape than make promises we cannot keep.</p>
              </div>
            </Reveal>
            <Reveal className="pricing-faq-list">
              <div className="divide-y divide-border rounded-[1.5rem] border border-border bg-card px-6 sm:px-8">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={faq.question} data-testid={`faq-item-${index}`}>
                      <button
                        type="button"
                        className="landing-focus flex w-full items-center justify-between gap-5 py-6 text-left"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        data-testid={`button-faq-${index}`}
                      >
                        <span className="font-serif text-xl tracking-[-.035em] sm:text-2xl">{faq.question}</span>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && <p className="max-w-2xl pb-7 pr-8 text-sm leading-7 text-muted-foreground" data-testid={`text-faq-answer-${index}`}>{faq.answer}</p>}
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
          <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full border-[28px] border-secondary/30" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.65fr] lg:items-end">
            <Reveal className="pricing-cta-heading">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--landing-cyan))]">Start where you are</p>
                <h2 className="mt-6 max-w-3xl font-serif text-5xl font-semibold leading-[.9] tracking-[-.075em] sm:text-7xl">There is room for every part.</h2>
              </div>
            </Reveal>
            <Reveal className="pricing-cta-copy">
              <div>
                <p className="text-lg leading-8 text-[hsl(var(--landing-light-text))]">Create a church profile and take a first look. You can come back to the plan conversation when the time is right.</p>
                <Link href="/sign-up" className="landing-focus mt-8 inline-flex items-center gap-3 rounded-full bg-secondary px-6 py-3.5 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90" data-testid="link-pricing-final-start">
                  Begin with Every Part <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="landing-focus w-fit rounded-xl" data-testid="link-pricing-footer-home"><Brand /></Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/#how-it-works" className="landing-focus rounded-md hover:text-foreground" data-testid="link-pricing-footer-how-it-works">How It Works</Link>
            <Link href="/sign-in" className="landing-focus rounded-md hover:text-foreground" data-testid="link-pricing-footer-login">Login</Link>
            <a href="mailto:hello@everypart.org" className="landing-focus rounded-md hover:text-foreground" data-testid="link-pricing-footer-contact">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">A thoughtful beginning for meaningful ministry.</p>
        </div>
      </footer>
    </div>
  );
}