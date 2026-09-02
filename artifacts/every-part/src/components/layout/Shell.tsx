import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { LayoutDashboard, Settings, Users, ArrowRight, UsersRound } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { PuzzleCluster } from "@/components/puzzle-cluster";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profiles", label: "Profiles", icon: Users },
  { href: "/teams", label: "Teams", icon: UsersRound },
  { href: "/church-setup", label: "Church Setup", icon: Settings },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  return (
    <div className="relative min-h-screen overflow-hidden bg-muted/30 flex flex-col">
      <PuzzleCluster size="sm" className="pointer-events-none absolute -bottom-3 left-[-1rem] z-0 opacity-25" />
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/dashboard" className="group flex items-center rounded-xl">
              <Brand />
            </Link>
            
            <nav className="order-3 flex w-full max-w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden md:flex font-medium" asChild>
              <Link href="/profile/riverstone-community">
                Preview Assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border border-border/50"
                }
              }}
            />
          </div>
        </div>
      </header>
      
      <main className="relative z-10 flex-1 flex flex-col">
        {children}
      </main>

      <footer className="relative z-10 mt-auto py-6 border-t border-border/50 text-center">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Every Part</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-secondary'}`} />
            <span>Systems {health?.status === 'ok' ? 'Operational' : 'Checking...'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
