import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Cross,
  Infinity as InfinityIcon,
  Network,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PuzzleCluster } from "@/components/puzzle-cluster";
import { PublicLayout } from "@/components/public-layout";
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
    valueNote: "Coming soon · not currently for sale",
    action: "Coming soon",
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
    valueNote: "Coming soon · not currently for sale",
    action: "Coming soon",
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
    valueNote: "Coming soon · not currently for sale",
    action: "Coming soon",
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
    valueNote: "Coming soon · not currently for sale",
    action: "Coming soon",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    eyebrow: "Make room for everyone",
    profileLimit: "Unlimited",
    limitLabel: "Ministry Profiles",
    aiCredits: "1,000 AI credits each month",
    price: "$50",
    cadence: "per month",
    description: "For churches ready to welcome every person into the conversation.",
    icon: InfinityIcon,
    tone: "dark",
    valueNote: "Coming soon · not currently for sale",
    action: "Coming soon",
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
      "Not yet. Every Part is coming soon and is not currently for sale. These prices are shared so churches can see the planned options before launch.",
  },
  {
    question: "What does Starter include?",
    answer:
      "Starter is the planned free option, with up to 5 Ministry Profiles after plan limits begin. During early access, every church can create unlimited profiles. Every Part is not currently for sale.",
  },
  {
    question: "What does an active profile mean?",
    answer:
      "Each completed adult or youth Ministry Profile is a saved ministry record. No church has a profile cap during early access. The plan capacities shown here are planned for a future launch, and existing profiles will remain available if limits are introduced later.",
  },
  {
    question: "Can we change plans later?",
    answer:
      "Plan management will be available after Every Part opens for sale.",
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { data: billingPlans } = useGetBillingPlans();

  return (
    <PublicLayout
      title="Pricing | Every Part"
      description="Choose a monthly Every Part plan for your church."
    >
        <section className="relative overflow-hidden bg-primary px-5 pb-20 pt-16 text-primary-foreground sm:px-8 sm:pb-28 sm:pt-24">
          <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full border-[40px] border-secondary/25" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-10rem] left-[38%] h-80 w-80 rounded-full border-[28px] border-[hsl(var(--landing-cyan)/.18)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <Reveal className="pricing-hero-eyebrow">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--landing-cyan))]">
                <span className="h-px w-8 bg-secondary" />
                   Planned church pricing · coming soon
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
                   We are sharing the planned pricing early. Every Part is not currently for sale, and paid checkout is not open yet.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="relative px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-7xl">
             <Reveal className="pricing-notice">
              <aside className="relative mt-8 rounded-[1.5rem] border border-secondary/40 bg-[hsl(var(--secondary)/.12)] p-6 shadow-[0_18px_45px_hsl(var(--foreground)/.08)] sm:mt-10 sm:flex sm:items-start sm:gap-5 sm:p-7" aria-label="Pricing notice">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <CircleHelp className="h-5 w-5" />
                </span>
                <div className="mt-4 sm:mt-0">
                    <p className="text-sm font-bold uppercase tracking-[.15em] text-accent" data-testid="text-pricing-label">Coming soon · not currently for sale</p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/80" data-testid="text-preview-pricing-notice">
                     These prices are for planning and conversation only. Every Part is coming soon, and churches cannot purchase a plan yet.
                  </p>
                   <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/80">
                     During early access, every church can create unlimited Ministry Profiles. The profile counts shown below are planned future limits; current AI credit limits still apply.
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

             <div className="mt-10 grid gap-4 lg:grid-cols-5 lg:items-start">
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
                       <div className={`mt-5 min-w-0 rounded-2xl p-4 ${featured || dark ? "bg-white/10" : "bg-muted/70"}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-[.14em] ${featured || dark ? "text-[hsl(var(--landing-slate))]" : "text-muted-foreground"}`}>Includes up to</p>
                         <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2">
                           <span className={`min-w-0 font-serif text-4xl font-semibold tracking-[-.06em] ${plan.id === "unlimited" ? "break-all lg:text-3xl" : ""}`} data-testid={`text-plan-limit-${plan.id}`}>{plan.profileLimit}</span>
                           <span className={`min-w-0 text-xs ${featured || dark ? "text-[hsl(var(--landing-light-text))]" : "text-muted-foreground"}`}>{plan.limitLabel}</span>
                        </div>
                      </div>
                        <p className={`mt-3 text-sm font-semibold ${dark ? "text-primary" : featured ? "text-secondary" : "text-primary"}`}>
                         {plan.aiCredits}
                       </p>
                      <p className={`mt-4 min-h-[48px] text-sm leading-6 ${featured || dark ? "text-[hsl(var(--landing-light-text))]" : "text-muted-foreground"}`}>{plan.description}</p>
                      <p className={`mt-3 text-xs font-semibold ${featured || dark ? "text-secondary" : "text-accent"}`} data-testid={`text-plan-value-${plan.id}`}>{plan.valueNote}</p>
                      <div className="mt-auto pt-8">
                         <span
                           className={`inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold opacity-75 ${featured ? "bg-secondary text-secondary-foreground" : dark ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}
                           aria-disabled="true"
                           data-testid={`link-plan-action-${plan.id}`}
                         >
                          {plan.action} <ArrowRight className="h-4 w-4" />
                         </span>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
                <p className="mt-6 text-center text-xs leading-5 text-muted-foreground" data-testid="text-pricing-footnote">
                 Planned pricing only. Checkout and paid subscriptions will open when Every Part launches.
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
                 <p className="text-lg leading-8 text-[hsl(var(--landing-light-text))]">Every Part is coming soon. We are sharing the plan conversation now so churches can see what is ahead.</p>
                  <Link href="/for-churches" className="landing-focus mt-8 inline-flex items-center gap-3 rounded-full bg-secondary px-6 py-3.5 font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:bg-secondary/90" data-testid="link-pricing-final-start">
                   Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
    </PublicLayout>
  );
}