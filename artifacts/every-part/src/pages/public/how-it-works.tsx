import { PublicLayout, Reveal, Eyebrow, ScriptureCallout } from "@/components/public-layout";
import { problemCards, pathway } from "@/data/public-content";

export default function HowItWorks() {
  return (
    <PublicLayout 
      title="How It Works | Every Part" 
      description="See how Every Part provides churches a prayerful pathway from discovery to meaningful ministry."
    >
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <Reveal><Eyebrow>Why churches need a clearer view</Eyebrow></Reveal>
            <Reveal className="[animation-delay:.1s]">
              <div>
                <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                  Your church already has people God has equipped.
                </h1>
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

          <div className="mt-32 grid gap-8 lg:grid-cols-[1fr_.72fr] lg:items-end">
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
    </PublicLayout>
  );
}
