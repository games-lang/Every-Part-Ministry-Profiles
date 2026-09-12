import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export function PortraitChapter({
  number,
  title,
  icon: Icon,
  children,
  className = "",
}: {
  number: number;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative pl-8 md:pl-12 py-10 border-l border-primary/20 print:border-l-0 print:pl-0 print:py-4 last:border-l-transparent ${className}`}>
      <div className="absolute left-[-1.25rem] top-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border border-primary/30 text-primary shadow-sm print:hidden">
        <span className="font-serif text-lg font-medium">{number}</span>
      </div>
      
      <div className="mb-6 print:mb-3">
        <h2 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-foreground flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 text-primary/60 print:hidden" />}
          {title}
        </h2>
      </div>
      <div className="text-foreground/90 space-y-6">
        {children}
      </div>
    </section>
  );
}
