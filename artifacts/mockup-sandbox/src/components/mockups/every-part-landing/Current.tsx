import './_group.css';
import { ArrowRight, HeartHandshake, Map, Users } from 'lucide-react';

const features = [
  {
    icon: HeartHandshake,
    title: 'Meaningful Discovery',
    description:
      'Guide members through a thoughtful assessment covering passions, skills, experience, and spiritual gifts.',
  },
  {
    icon: Map,
    title: 'Clear Pathways',
    description:
      'Review comprehensive profiles that make it obvious where someone might thrive, not just where there is a gap.',
  },
  {
    icon: Users,
    title: 'Better Conversations',
    description:
      'Generate beautiful, print-ready profiles to guide your pastoral and leadership conversations.',
  },
];

export function Current() {
  return (
    <div
      className="ep-font-sans min-h-screen flex flex-col"
      style={{ background: 'var(--ep-background)', color: 'var(--ep-foreground)' }}
    >
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          borderColor: 'rgba(13,63,45,.14)',
          background: 'rgba(248,247,243,.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div
              className="ep-font-serif flex h-8 w-8 items-center justify-center rounded text-lg font-bold"
              style={{ background: 'var(--ep-primary)', color: 'var(--ep-background)' }}
            >
              E
            </div>
            <span className="ep-font-serif text-2xl font-medium tracking-tight">Every Part</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="#" className="px-3 py-2">Sign In</a>
            <a
              href="#"
              className="rounded-md px-5 py-2.5"
              style={{ background: 'var(--ep-primary)', color: 'var(--ep-background)' }}
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-20 pt-32 md:pb-32 md:pt-44">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full blur-3xl"
            style={{ background: 'rgba(207,92,54,.12)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-[30rem] w-[30rem] rounded-full blur-3xl"
            style={{ background: 'rgba(15,86,61,.05)' }}
          />
          <div className="relative z-[1] mx-auto max-w-4xl text-center">
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'var(--ep-muted)', color: 'var(--ep-muted-foreground)' }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ep-secondary)' }} />
              For Church Leaders &amp; Pastors
            </div>
            <h1 className="ep-font-serif mb-8 text-5xl font-medium leading-[1.1] tracking-tight md:text-7xl">
              Help your people see how{' '}
              <span className="pr-2 italic" style={{ color: 'var(--ep-secondary)' }}>
                God has wired them.
              </span>
            </h1>
            <p
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl"
              style={{ color: 'var(--ep-muted-foreground)' }}
            >
              Every Part is a ministry discovery tool that replaces static volunteer forms with an
              engaging assessment, helping you start meaningful conversations about serving.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="w-full rounded-full px-8 py-4 text-base font-medium sm:w-auto"
                style={{ background: 'var(--ep-primary)', color: 'var(--ep-background)' }}
              >
                Start Free for Your Church
              </a>
              <a
                href="#"
                className="w-full rounded-full border px-8 py-4 text-base font-medium sm:w-auto"
                style={{ borderColor: 'var(--ep-border)' }}
              >
                Preview Assessment
              </a>
            </div>
          </div>
        </section>

        <section className="border-y px-6 py-24" style={{ background: 'var(--ep-card)', borderColor: 'var(--ep-border)' }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="ep-font-serif mb-4 text-3xl font-medium tracking-tight md:text-4xl">
                Beyond the clipboard
              </h2>
              <p className="mx-auto max-w-2xl text-lg" style={{ color: 'var(--ep-muted-foreground)' }}>
                Volunteer forms are transactional. Every Part builds a profile that honors the whole person.
              </p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center rounded-2xl border p-6 text-center shadow-sm"
                  style={{ background: 'var(--ep-background)', borderColor: 'rgba(13,63,45,.1)' }}
                >
                  <div
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'rgba(15,86,61,.1)', color: 'var(--ep-primary)' }}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="ep-font-serif mb-3 text-xl font-medium">{feature.title}</h3>
                  <p className="leading-relaxed" style={{ color: 'var(--ep-muted-foreground)' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-24 text-center md:py-32" style={{ background: 'var(--ep-primary)', color: 'var(--ep-background)' }}>
          <div className="relative z-[1] mx-auto max-w-3xl">
            <h2 className="ep-font-serif mb-6 text-4xl font-medium tracking-tight md:text-5xl">Ready to equip every part?</h2>
            <p className="mb-10 text-lg opacity-80 md:text-xl">Set up your church&apos;s custom discovery assessment in under 5 minutes.</p>
            <a
              href="#"
              className="inline-flex items-center rounded-full px-8 py-4 text-base font-medium"
              style={{ background: 'var(--ep-secondary)', color: '#fff8f2' }}
            >
              Create Your Church Profile <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-12 text-center" style={{ borderColor: 'var(--ep-border)' }}>
        <div className="flex items-center justify-center gap-2">
          <div className="ep-font-serif flex h-6 w-6 items-center justify-center rounded text-sm font-bold" style={{ background: 'rgba(15,86,61,.15)', color: 'var(--ep-primary)' }}>E</div>
          <span className="ep-font-serif text-lg font-medium">Every Part</span>
        </div>
      </footer>
    </div>
  );
}
