import "./_group.css";
import { useEffect, useState, type AnchorHTMLAttributes } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Cross,
  Menu,
  Network,
  Sparkles,
  X,
} from "lucide-react";

function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={href} {...props} />;
}

const plans = [
  {
    id: "start-free",
    name: "Start Free",
    eyebrow: "Begin gently",
    price: "$0",
    cadence: "per month",
    description: "A simple place to begin exploring Every Part with your church.",
    icon: Cross,
    tone: "light",
    features: [
      "Church setup",
      "Ministry Profiles",
      "A small leader team",
      "Search and filtering",
    ],
    action: "Start with the free plan",
    href: "/sign-up",
  },
  {
    id: "church",
    name: "Church",
    eyebrow: "A steady next step",
    price: "$79",
    cadence: "per month",
    description: "For a church ready to make discovery part of its regular ministry rhythm.",
    icon: Sparkles,
    tone: "featured",
    features: [
      "Everything in Start Free",
      "Expanded leader access",
      "Team conversations",
      "Profile history",
      "Search and filtering across your church",
    ],
    action: "Choose Church",
    href: "/sign-up",
  },
  {
    id: "growing-church",
    name: "Growing Church",
    eyebrow: "For a wider rhythm",
    price: "$149",
    cadence: "per month",
    description: "For churches building a shared language of gifts, service, and development.",
    icon: Network,
    tone: "light",
    features: [
      "Everything in Church",
      "More leader access",
      "Broader profile history",
      "Support for growing ministry teams",
    ],
    action: "Choose Growing Church",
    href: "/sign-up",
  },
  {
    id: "multi-site",
    name: "Multi-site",
    eyebrow: "Many places, one purpose",
    price: "Custom",
    cadence: "let’s talk about fit",
    description: "A thoughtful conversation for churches connecting more than one site.",
    icon: Compass,
    tone: "dark",
    features: [
      "A conversation about your structure",
      "Ministry Profiles across sites",
      "Leader access shaped to your teams",
      "A considered path forward",
    ],
    action: "Discuss multi-site fit",
    href: "/sign-up",
  },
];

const comparisonRows = [
  {
    feature: "Ministry Profiles",
    note: "A fuller picture for ministry conversations",
    values: ["Included", "Included", "Included", "Included"],
  },
  {
    feature: "Church setup",
    note: "Shape your church, teams, and places to serve",
    values: ["Included", "Included", "Included", "Included"],
  },
  {
    feature: "Search and filtering",
    note: "Find a place to begin exploring together",
    values: ["Included", "Included", "Included", "Included"],
  },
  {
    feature: "Team conversations",
    note: "Give leaders a shared starting point",
    values: ["—", "Included", "Included", "Included"],
  },
  {
    feature: "Profile history",
    note: "Return to the conversation as seasons change",
    values: ["—", "Included", "Included", "Included"],
  },
  {
    feature: "Leader access",
    note: "Invite the people who help your church discern",
    values: ["Small team", "Expanded", "More access", "Shaped together"],
  },
];

const faqs = [
  {
    question: "Is this live billing?",
    answer:
      "No. This is preview pricing while Every Part is taking shape. Plans, limits, and billing details will be confirmed with churches before billing is enabled.",
  },
  {
    question: "What does Start Free include?",
    answer:
      "Start Free is a low-pressure way to begin: set up your church, create Ministry Profiles, and start exploring with a small leader team. The exact limits will be confirmed before any billing begins.",
  },
  {
    question: "Can we change plans later?",
    answer:
      "That is the intention. We are designing the path so a church can begin simply and grow into a plan that fits its ministry rhythm. We will confirm the details with you before billing is enabled.",
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

function Brand() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-serif text-lg font-bold text-primary-foreground">
        E
      </span>
      <span className="font-serif text-lg font-semibold tracking-[-.045em]">
        Every Part
      </span>
    </span>
  );
}

export default function PricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
                Preview pricing · a clear beginning
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
              <aside className="relative -mt-8 rounded-[1.5rem] border border-secondary/40 bg-[hsl(var(--secondary)/.12)] p-6 shadow-[0_18px_45px_hsl(var(--foreground)/.08)] sm:-mt-10 sm:flex sm:items-start sm:gap-5 sm:p-7" aria-label="Preview pricing notice">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <CircleHelp className="h-5 w-5" />
                </span>
                <div className="mt-4 sm:mt-0">
                  <p className="text-sm font-bold uppercase tracking-[.15em] text-accent" data-testid="text-preview-pricing-label">Preview pricing</p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/80" data-testid="text-preview-pricing-notice">
                    Plans, limits, and billing are still being shaped with churches. The prices shown here are placeholders and will be confirmed with you before billing is enabled. Nothing on this page starts a payment or checkout flow.
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
                const featured = plan.tone === "featured";
                const dark = plan.tone === "dark";
                return (
                  <Reveal key={plan.id} className={`pricing-card-reveal-${index}`}>
                    <article
                      className={`relative flex h-full min-h-[520px] flex-col rounded-[1.75rem] border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_hsl(var(--foreground)/.12)] sm:p-8 ${
                        featured
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_20px_50px_hsl(var(--primary)/.2)] lg:-mt-5 lg:min-h-[560px]"
                          : dark
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-card"
                      }`}
                      data-testid={`card-plan-${plan.id}`}
                    >
                      {featured && (
                        <span className="absolute right-7 top-7 rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-secondary-foreground" data-testid="badge-plan-recommended">
                          Most churches begin here
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-secondary" : dark ? "bg-white/10 text-secondary" : "bg-muted text-primary"}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        {!featured && <span className={`text-[10px] font-bold uppercase tracking-[.16em] ${dark ? "text-[hsl(var(--landing-cyan))]" : "text-muted-foreground"}`}>{plan.eyebrow}</span>}
                      </div>
                      {featured && <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--landing-cyan))]">{plan.eyebrow}</p>}
                      <h3 className="mt-6 font-serif text-3xl font-semibold tracking-[-.055em]" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</h3>
                      <div className="mt-7 flex items-baseline gap-2">
                        <span className="font-serif text-5xl font-semibold tracking-[-.07em]" data-testid={`text-plan-price-${plan.id}`}>{plan.price}</span>
                        <span className={`text-xs ${featured || dark ? "text-[hsl(var(--landing-slate))]" : "text-muted-foreground"}`}>{plan.cadence}</span>
                      </div>
                      <p className={`mt-5 min-h-[72px] text-sm leading-6 ${featured || dark ? "text-[hsl(var(--landing-light-text))]" : "text-muted-foreground"}`}>{plan.description}</p>
                      <div className={`my-7 h-px ${featured || dark ? "bg-white/15" : "bg-border"}`} />
                      <ul className="space-y-3" aria-label={`${plan.name} features`}>
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-3 text-sm leading-5" data-testid={`feature-${plan.id}-${feature.toLowerCase().replaceAll(" ", "-")}`}>
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured || dark ? "text-secondary" : "text-accent"}`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-8">
                        {plan.href.startsWith("mailto:") ? (
                          <a
                            href={plan.href}
                            className={`landing-focus inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${dark ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground"}`}
                            data-testid={`link-plan-action-${plan.id}`}
                          >
                            {plan.action} <ArrowUpRight className="h-4 w-4" />
                          </a>
                        ) : (
                          <Link
                            href={plan.href}
                            className={`landing-focus inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${featured ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary text-primary-foreground hover:bg-accent"}`}
                            data-testid={`link-plan-action-${plan.id}`}
                          >
                            {plan.action} <ArrowRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground" data-testid="text-pricing-footnote">
              Placeholder pricing shown in USD per month. Final plan details will be confirmed before billing is enabled.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-muted/60 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <Reveal className="pricing-compare-label">
                <div>
                  <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-8 bg-secondary" />What stays at the center</p>
                  <Cross className="mt-8 h-8 w-8 text-secondary" />
                </div>
              </Reveal>
              <Reveal className="pricing-compare-heading">
                <div>
                  <h2 className="max-w-3xl font-serif text-4xl font-semibold leading-[.96] tracking-[-.065em] sm:text-6xl">The tools are modest. The conversation is meaningful.</h2>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Every Part gives your leaders a clear place to start. It does not replace prayer, relationship, or the wisdom of people who know one another well.</p>
                </div>
              </Reveal>
            </div>

            <Reveal className="pricing-table-reveal">
              <div className="mt-14 overflow-x-auto rounded-[1.75rem] border border-border bg-card">
                <table className="w-full min-w-[760px] border-collapse text-left" data-testid="table-pricing-comparison">
                  <caption className="sr-only">Preview comparison of Every Part plans and features</caption>
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="w-[31%] p-6 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Included in the plan</th>
                      {plans.map((plan) => (
                        <th scope="col" key={plan.id} className="p-6 text-center font-serif text-lg tracking-[-.03em]" data-testid={`table-header-${plan.id}`}>{plan.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="border-b border-border last:border-b-0">
                        <th scope="row" className="p-6 align-top font-medium">
                          <span className="block" data-testid={`text-comparison-feature-${row.feature.toLowerCase().replaceAll(" ", "-")}`}>{row.feature}</span>
                          <span className="mt-1 block max-w-[210px] text-xs font-normal leading-5 text-muted-foreground">{row.note}</span>
                        </th>
                        {row.values.map((value, index) => (
                          <td key={`${row.feature}-${plans[index].id}`} className={`p-6 text-center text-sm ${value === "—" ? "text-muted-foreground/50" : "text-foreground/75"}`} data-testid={`text-comparison-${row.feature.toLowerCase().replaceAll(" ", "-")}-${plans[index].id}`}>
                            {value === "Included" ? <Check className="mx-auto h-4 w-4 text-secondary" aria-label="Included" /> : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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