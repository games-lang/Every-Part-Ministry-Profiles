import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, HeartHandshake, Check } from "lucide-react";
import { PublicLayout, Reveal, Eyebrow, ScriptureCallout } from "@/components/public-layout";
import { dimensions, sampleProfileDetails } from "@/data/public-content";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appPath = (path: string) => `${basePath}${path}`;

export default function MinistryProfiles() {
  const [sampleCarouselPaused, setSampleCarouselPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sampleCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const viewport = sampleCarouselRef.current;
    if (!viewport || prefersReducedMotion) return;
    let frame = 0;
    let lastTime = 0;
    const tick = (time: number) => {
      if (!sampleCarouselPaused && time - lastTime > 16) {
        const loopPoint = viewport.scrollWidth / 2;
        if (loopPoint > 0) {
          if (viewport.scrollLeft >= loopPoint) viewport.scrollLeft -= loopPoint;
          else viewport.scrollLeft += 0.45;
        }
        lastTime = time;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [prefersReducedMotion, sampleCarouselPaused]);

  const scrollSampleProfiles = (direction: number) => {
    sampleCarouselRef.current?.scrollBy({
      left: direction * Math.min(sampleCarouselRef.current.clientWidth * 0.84, 720),
      behavior: "smooth",
    });
    setSampleCarouselPaused(true);
  };

  return (
    <PublicLayout 
      title="Ministry Profiles | Find Your Part"
      description="A Ministry Profile gathers a fuller picture of someone's story. It gives people language for what they are noticing and gives leaders a gracious place to begin."
    >
      <section className="bg-muted/60 px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-24">
            <Reveal>
              <Eyebrow>The Ministry Profile</Eyebrow>
              <h1 className="mt-6 max-w-xl font-serif text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">
                Discover the Whole Person
              </h1>
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
            </Reveal>
          </div>

          <div id="sample-profile" className="mt-24 scroll-mt-24">
            <Reveal>
              <div className="mb-8 max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Four fictional sample profiles</p>
                <h3 className="mt-3 font-serif text-3xl tracking-[-.045em] sm:text-4xl">See how each pathway starts a different conversation.</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  These examples show the kind of reflection each profile can surface. They offer possibilities and questions—not labels or a verdict about anyone’s calling.
                </p>
              </div>
            </Reveal>
            <div
              className="sample-profile-carousel"
              aria-label="Detailed sample Ministry Profiles"
              onMouseEnter={() => setSampleCarouselPaused(true)}
              onMouseLeave={() => setSampleCarouselPaused(false)}
              onFocus={() => setSampleCarouselPaused(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setSampleCarouselPaused(false);
                }
              }}
            >
              <div className="sample-profile-carousel__controls">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Scroll through the profiles</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="landing-focus sample-profile-carousel__arrow"
                    aria-label="Show previous sample profile"
                    onClick={() => scrollSampleProfiles(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="landing-focus sample-profile-carousel__arrow"
                    aria-label="Show next sample profile"
                    onClick={() => scrollSampleProfiles(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div ref={sampleCarouselRef} className="sample-profile-carousel__viewport">
                <div className="sample-profile-carousel__track">
                  {[...sampleProfileDetails, ...sampleProfileDetails].map((profile, index) => (
                    <article
                      key={`${profile.name}-${index}`}
                      aria-hidden={index >= sampleProfileDetails.length}
                      className={`sample-profile-card sample-profile-card--${profile.theme}`}
                    >
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
                          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">Fictional example · {profile.pathway} · {profile.age}</p>
                          <h4 className="mt-1 font-serif text-2xl tracking-[-.04em] text-white">{profile.name}’s profile</h4>
                        </div>
                      </div>
                      <p className="relative z-10 mt-6 max-w-md text-sm leading-6 text-white/78">{profile.intro}</p>
                    </div>
                    <div className="flex h-full flex-col p-6 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="sample-profile-card__eyebrow">Formation notes to explore</p>
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
