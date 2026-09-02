import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state rounded-2xl border border-dashed border-primary/20 bg-primary/[.025] px-6 py-14 text-center ${className}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/20 text-primary" aria-hidden="true">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 font-serif text-2xl font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}