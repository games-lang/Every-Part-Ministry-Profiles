import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { BetaNotice } from "./beta-notice";
import { PublicAiAssistant } from "./public-ai-assistant";

export function Reveal({
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

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] ${light ? "text-[hsl(var(--landing-cyan))]" : "text-accent"}`}>
      <span className={`h-px w-8 ${light ? "bg-secondary" : "bg-secondary"}`} />
      {children}
    </p>
  );
}

export function ScriptureCallout({
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

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="landing-focus rounded-xl" aria-label="Every Part home" onClick={closeMenu}>
          <Brand />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Main navigation">
          <Link href="/how-it-works" className={`landing-focus landing-link rounded-md px-1 py-2 ${location === '/how-it-works' ? 'text-secondary' : ''}`}>How It Works</Link>
          <Link href="/ministry-profiles" className={`landing-focus landing-link rounded-md px-1 py-2 ${location === '/ministry-profiles' ? 'text-secondary' : ''}`}>Ministry Profiles</Link>
          <Link href="/partfinder" className={`landing-focus landing-link rounded-md px-1 py-2 ${location === '/partfinder' ? 'text-secondary' : ''}`}>PartFinder</Link>
          <Link href="/for-churches" className={`landing-focus landing-link rounded-md px-1 py-2 ${location === '/for-churches' ? 'text-secondary' : ''}`}>For Churches</Link>
          <Link href="/why-every-part" className={`landing-focus landing-link rounded-md px-1 py-2 ${location === '/why-every-part' ? 'text-secondary' : ''}`}>Why Every Part</Link>
          <Link href="/pricing" className={`landing-focus landing-link rounded-md px-1 py-2 ${location === '/pricing' ? 'text-secondary' : ''}`} data-testid="link-home-pricing">Pricing</Link>
          <Link href="/sign-in" className="landing-focus landing-link rounded-md px-1 py-2">Leader sign in</Link>
          <Link href="/sign-up" className="landing-focus ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent">
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
            <Link href="/how-it-works" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">How It Works</Link>
            <Link href="/ministry-profiles" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">Ministry Profiles</Link>
            <Link href="/partfinder" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">PartFinder</Link>
            <Link href="/for-churches" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">For Churches</Link>
            <Link href="/why-every-part" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">Why Every Part</Link>
            <Link href="/pricing" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted" data-testid="link-home-mobile-pricing">Pricing</Link>
            <Link href="/sign-in" onClick={closeMenu} className="landing-focus rounded-lg px-3 py-3 font-medium hover:bg-muted">Leader sign in</Link>
            <Link href="/sign-up" onClick={closeMenu} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Try Every Part <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="landing-focus inline-flex rounded-xl" aria-label="Every Part home"><Brand compact /></Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Helping churches notice, name, and nurture the part every person has to play.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <Link href="/how-it-works" className="landing-focus landing-link rounded-md">How It Works</Link>
          <Link href="/ministry-profiles" className="landing-focus landing-link rounded-md">Ministry Profiles</Link>
          <Link href="/partfinder" className="landing-focus landing-link rounded-md">PartFinder</Link>
          <Link href="/for-churches" className="landing-focus landing-link rounded-md">For Churches</Link>
          <Link href="/why-every-part" className="landing-focus landing-link rounded-md">Why Every Part</Link>
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
  );
}

export function PublicLayout({ children, title, description }: { children: React.ReactNode, title: string, description: string }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);

  return (
    <>
      <div className="ep-landing min-h-[100dvh] overflow-x-hidden flex flex-col">
        <BetaNotice />
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter />
      </div>
      <PublicAiAssistant />
    </>
  );
}