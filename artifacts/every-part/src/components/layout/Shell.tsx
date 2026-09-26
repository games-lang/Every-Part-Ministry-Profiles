import { ReactNode, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { Compass, CreditCard, LayoutDashboard, Settings, Users, ArrowRight, UsersRound, ShieldCheck } from "lucide-react";
import { useGetAppAdminAccess, useGetMyChurch, useHealthCheck } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/brand";
import { PartFinderAssistant } from "@/components/partfinder-assistant";
import { BetaNotice } from "@/components/beta-notice";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profiles", label: "People", icon: Users },
  { href: "/teams", label: "Teams", icon: UsersRound },
  { href: "/leadership-profile", label: "My Leadership", icon: Compass },
  { href: "/church-setup", label: "Church Setup", icon: Settings },
  { href: "/billing", label: "Plan & usage", icon: CreditCard },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const accountButtonRef = useRef<HTMLDivElement>(null);
  const { data: health } = useHealthCheck();
  const { data: adminAccess } = useGetAppAdminAccess();
  const { data: church } = useGetMyChurch();

  useEffect(() => {
    const container = accountButtonRef.current;
    if (!container) return;
    // Clerk renders the button here but portals its dropdown elsewhere in the body.
    // Neither avatar exposes an appearance prop for its generated alt text.
    const fixAvatarAlt = (image: HTMLImageElement) => {
      if (
        (container.contains(image) || image.closest(".cl-userButtonPopoverCard")) &&
        (!image.alt.trim() || image.alt.trim() === "'s logo")
      ) {
        image.alt = "Account avatar";
      }
    };
    const inspect = (node: Node) => {
      if (node instanceof HTMLImageElement) fixAvatarAlt(node);
      else if (node instanceof Element) node.querySelectorAll("img").forEach(fixAvatarAlt);
    };
    inspect(container);
    document.querySelectorAll(".cl-userButtonPopoverCard img").forEach(fixAvatarAlt);
    const observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "attributes") inspect(change.target);
        else change.addedNodes.forEach(inspect);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["alt"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ep-shell flex min-h-[100dvh] flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="brand-rule" aria-hidden="true" />
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/dashboard" className="group flex items-center rounded-xl focus-visible:ring-0" aria-label="Every Part overview">
              <Brand compact />
            </Link>
            {church?.earlyAccessStatus === "early_access" && (
              <Link href="/about-early-access" className="hidden sm:inline-flex">
                <Badge variant="outline" className="border-secondary/60 bg-secondary/10 text-foreground">
                  Early Access
                </Badge>
              </Link>
            )}
            
            <nav className="order-3 flex w-full max-w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto" aria-label="Leader navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-offset-1 ${
                      isActive 
                         ? "bg-primary text-primary-foreground shadow-sm"
                         : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {adminAccess?.isAdmin && (
                <Link
                  href="/app-admin"
                  aria-current={location.startsWith("/app-admin") ? "page" : undefined}
                  className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-offset-1 ${
                    location.startsWith("/app-admin")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid="link-app-admin"
                >
                  <ShieldCheck className="h-4 w-4" />
                  EveryPart CEO
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden md:flex font-medium" asChild>
              <Link href="/profile/riverstone-community">
                Preview Assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <div ref={accountButtonRef}>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border border-border/50",
                  userButtonPopoverCard:
                    "bg-background border border-border shadow-xl text-foreground",
                  userButtonPopoverMain: "bg-background",
                  userButtonPopoverActionButton:
                    "text-foreground hover:bg-muted hover:text-foreground",
                  userButtonPopoverActionButtonText: "text-foreground",
                  userButtonPopoverActionButtonIcon: "text-muted-foreground",
                  userButtonPopoverActionButton__manageAccount:
                    "text-foreground hover:bg-muted hover:text-foreground",
                  userButtonPopoverActionButton__signOut:
                    "text-destructive hover:bg-destructive/10 hover:text-destructive",
                  userButtonPopoverFooter: "border-t border-border",
                }
              }}
            />
            </div>
          </div>
        </div>
      </header>
      <BetaNotice />
      
      <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
        {children}
      </main>

      <footer className="mt-auto py-6 border-t border-border/50 text-center">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <p>{`© ${new Date().getFullYear()} Every Part`}</p>
          <div className="flex items-center gap-4">
            <Link href="/about-early-access" className="hover:text-foreground hover:underline">
              About Early Access
            </Link>
             <Link href="/privacy" className="hover:text-foreground hover:underline">
               Privacy
             </Link>
             <Link href="/terms" className="hover:text-foreground hover:underline">
               Terms
             </Link>
            <div className="flex items-center gap-2" role="status" aria-label={`Systems ${health?.status === 'ok' ? 'operational' : 'checking'}`}>
              <div className={`h-2 w-2 rounded-full ${health?.status === 'ok' ? 'bg-accent' : 'bg-secondary'}`} aria-hidden="true" />
              <span>Systems {health?.status === 'ok' ? 'Operational' : 'Checking...'}</span>
            </div>
          </div>
        </div>
      </footer>
      <PartFinderAssistant />
    </div>
  );
}
