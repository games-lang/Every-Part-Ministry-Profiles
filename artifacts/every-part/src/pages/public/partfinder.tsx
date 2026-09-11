import { Check, Puzzle } from "lucide-react";
import { PublicLayout, Reveal, Eyebrow } from "@/components/public-layout";
import { partfinderBenefits } from "@/data/public-content";

export default function Partfinder() {
  return (
    <PublicLayout 
      title="PartFinder | Every Part" 
      description="PartFinder helps pastors see patterns across adult Ministry Profiles, think through a ministry need, and enter a conversation with better questions."
    >
      <section className="bg-[hsl(var(--primary-deep))] px-5 py-24 text-primary-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.84fr_1.16fr] lg:items-end">
            <Reveal>
              <Eyebrow light>Meet PartFinder</Eyebrow>
              <h1 className="mt-6 max-w-2xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                A clearer starting point for the next ministry conversation.
              </h1>
            </Reveal>
            <Reveal className="[animation-delay:.1s]">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 text-secondary">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Puzzle className="h-5 w-5" />
                  </span>
                   <p className="text-sm font-semibold uppercase tracking-[.14em]">Pastoral formation support</p>
                </div>
                <p className="mt-6 text-lg leading-8 text-[hsl(var(--landing-light-text))]">
                   PartFinder helps pastors notice who someone is becoming, think through a ministry need, and enter a conversation about where that person might grow into their part in the body of Christ.
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
                  <ul className="mt-8 space-y-4">
                    {benefit.points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm leading-6 text-white/90">
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
            <div className="rounded-[1.75rem] border border-white/15 bg-white/[.07] p-7 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[hsl(var(--landing-cyan))]">How it works</p>
              <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_.9fr] lg:gap-16">
                 <div>
                   <h3 className="font-serif text-2xl tracking-[-.04em] sm:text-3xl">Formation, with humility.</h3>
                  <p className="mt-4 text-sm leading-7 text-[hsl(var(--landing-light-text))]">
                     PartFinder can help leaders notice themes in structured profile signals and verified evidence. It surfaces places to begin a growth conversation; leaders and members discern next steps together.
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                    <p className="text-sm leading-6 text-white/90">Surfaces patterns from completed adult profiles, filtering out minors entirely.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                     <p className="text-sm leading-6 text-white/90">Highlights shared gifts, passions, and availability as conversation themes.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                     <p className="text-sm leading-6 text-white/90">Never decides someone’s part or replaces the discernment of leaders and the Holy Spirit.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
