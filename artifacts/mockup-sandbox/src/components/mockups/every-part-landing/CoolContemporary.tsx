import './cool-contemporary.css';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  HeartHandshake,
  Map,
  Menu,
  Sparkles,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: HeartHandshake,
    number: '01',
    title: 'Meaningful Discovery',
    description:
      'Guide members through a thoughtful assessment covering passions, skills, experience, and spiritual gifts.',
  },
  {
    icon: Map,
    number: '02',
    title: 'Clear Pathways',
    description:
      'Review comprehensive profiles that make it obvious where someone might thrive, not just where there is a gap.',
  },
  {
    icon: Users,
    number: '03',
    title: 'Better Conversations',
    description:
      'Generate beautiful, print-ready profiles to guide your pastoral and leadership conversations.',
  },
];

export function CoolContemporary() {
  return (
    <div className="ep-cool min-h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-[var(--cool-line)] bg-[#f4f8f8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="Every Part home">
            <span className="ep-cool-display flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cool-ink)] text-lg font-bold text-[#d7f1ef]">E</span>
            <span className="ep-cool-display text-lg font-semibold tracking-[-.04em]">Every Part</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#how-it-works" className="ep-cool-link">How it works</a>
            <a href="#for-leaders" className="ep-cool-link">For church leaders</a>
            <a href="#" className="ep-cool-link">Sign in</a>
            <a href="#" className="rounded-full bg-[var(--cool-ink)] px-5 py-2.5 text-[#edf5f7] transition hover:bg-[var(--cool-ocean)]">Get started</a>
          </nav>
          <a href="#how-it-works" className="rounded-lg border border-[var(--cool-line)] p-2.5 md:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></a>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:pb-32 lg:pt-28">
          <div className="pointer-events-none absolute -right-28 top-8 h-80 w-80 rounded-full border-[40px] border-[#bee5e3]/60 sm:h-[30rem] sm:w-[30rem]" />
          <div className="pointer-events-none absolute right-32 top-52 hidden h-3 w-3 rounded-full bg-[var(--cool-coral)] sm:block" />
          <div className="relative grid items-end gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
            <div>
              <div className="ep-cool-reveal mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--cool-ocean)]">
                <span className="h-px w-8 bg-[var(--cool-coral)]" />
                For church leaders &amp; pastors
              </div>
              <h1 className="ep-cool-display ep-cool-reveal ep-cool-reveal-delay max-w-3xl text-[clamp(3.3rem,8vw,7.7rem)] font-semibold leading-[.93] tracking-[-.075em]">
                Every person has a <span className="text-[var(--cool-ocean)]">place.</span>
              </h1>
              <p className="ep-cool-reveal ep-cool-reveal-delay-2 mt-8 max-w-xl text-lg leading-8 text-[#52647d] sm:text-xl">
                Every Part is a ministry discovery tool that replaces static volunteer forms with an engaging assessment, helping you start meaningful conversations about serving.
              </p>
              <div className="ep-cool-reveal ep-cool-reveal-delay-2 mt-10 flex flex-col gap-3 sm:flex-row">
                <a href="#" className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--cool-ink)] px-7 py-4 font-semibold text-[#edf5f7] shadow-[0_12px_24px_rgba(18,35,68,.16)] transition hover:-translate-y-0.5 hover:bg-[var(--cool-ocean)]">
                  Start Free for Your Church <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#" className="inline-flex items-center justify-center rounded-full border border-[var(--cool-line)] bg-[#f4f8f8]/50 px-7 py-4 font-semibold transition hover:border-[var(--cool-coral)] hover:text-[var(--cool-coral)]">
                  Preview Assessment
                </a>
              </div>
            </div>
            <div className="relative min-h-[280px] lg:min-h-[390px]">
              <div className="absolute bottom-2 right-0 w-full max-w-[470px] rotate-[-3deg] rounded-[2rem] border border-white/70 bg-[var(--cool-ink)] p-5 text-[#edf5f7] shadow-[0_28px_60px_rgba(18,35,68,.22)] sm:p-7">
                <div className="mb-16 flex items-center justify-between text-xs uppercase tracking-[.15em] text-[#9eb6c8]"><span>Discovery / 01</span><Sparkles className="h-4 w-4 text-[#ee795d]" /></div>
                <p className="ep-cool-display max-w-xs text-3xl leading-tight tracking-[-.045em] sm:text-4xl">What gives you energy when you’re serving others?</p>
                <div className="mt-12 flex items-center justify-between border-t border-white/15 pt-4 text-sm text-[#9eb6c8]"><span>Thoughtful questions</span><ArrowDownRight className="h-5 w-5 text-[#ee795d]" /></div>
              </div>
              <div className="absolute -bottom-4 left-4 h-28 w-28 rounded-3xl bg-[#d7f1ef] sm:left-0 sm:h-36 sm:w-36" />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[var(--cool-line)] bg-[#e8f2f3] px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--cool-ocean)]">A better starting point</p>
              <div><h2 className="ep-cool-display max-w-2xl text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">Beyond the clipboard</h2><p className="mt-5 max-w-xl text-lg leading-8 text-[#52647d]">Volunteer forms are transactional. Every Part builds a profile that honors the whole person.</p></div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="ep-cool-card rounded-[1.5rem] border border-[var(--cool-line)] bg-[#f4f8f8] p-7 sm:p-8">
                  <div className="mb-16 flex items-start justify-between"><span className="text-xs font-bold tracking-[.15em] text-[#7d91a5]">{feature.number}</span><feature.icon className="h-6 w-6 text-[var(--cool-coral)]" /></div>
                  <h3 className="ep-cool-display text-2xl font-semibold tracking-[-.04em]">{feature.title}</h3>
                  <p className="mt-4 leading-7 text-[#60728a]">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="for-leaders" className="px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[var(--cool-ocean)] text-[#edf5f7] lg:grid-cols-[1fr_.8fr]">
            <div className="p-8 sm:p-14 lg:p-20">
              <p className="mb-8 text-xs font-bold uppercase tracking-[.18em] text-[#a9dedd]">Built for the people who care for people</p>
              <h2 className="ep-cool-display max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-.055em] sm:text-6xl">Make room for the conversation.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#c3d8df]">Set up your church&apos;s custom discovery assessment in under 5 minutes. Then spend your time doing what matters: knowing your people.</p>
              <a href="#" className="mt-10 inline-flex items-center gap-3 rounded-full bg-[var(--cool-coral)] px-7 py-4 font-semibold text-[#fff8f4] transition hover:-translate-y-0.5 hover:bg-[#f58c70]">Create Your Church Profile <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="relative min-h-[250px] overflow-hidden bg-[#0c3154] lg:min-h-full">
              <div className="absolute -right-12 top-12 h-72 w-72 rounded-full border-[34px] border-[#2d6380]" />
              <div className="absolute bottom-10 left-10 max-w-[240px] rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><Check className="mb-8 h-5 w-5 text-[#a9dedd]" /><p className="ep-cool-display text-xl leading-snug">The right fit starts with seeing the whole person.</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--cool-line)] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#60728a] sm:flex-row sm:items-center sm:justify-between">
          <a href="#" className="flex items-center gap-2 font-semibold text-[var(--cool-ink)]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--cool-ink)] text-xs text-[#d7f1ef]">E</span> Every Part</a>
          <p>Helping every person find a meaningful way to serve.</p>
        </div>
      </footer>
    </div>
  );
}