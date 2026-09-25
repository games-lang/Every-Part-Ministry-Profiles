import type { ChurchBranding } from "@workspace/api-client-react";

type ChurchProfileBrandingProps = {
  branding: ChurchBranding;
  className?: string;
};

export function ChurchProfileBranding({
  branding,
  className = "",
}: ChurchProfileBrandingProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card px-5 py-4 shadow-sm ${className}`}
      style={{ borderColor: `${branding.primaryColor}33` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.accentColor})`,
        }}
        aria-hidden="true"
      />
      <div className="flex items-center gap-4">
        {branding.logoUrl ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white p-2">
            <img
              src={branding.logoUrl}
              alt="Church logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-semibold"
            style={{
              backgroundColor: `${branding.primaryColor}14`,
              color: branding.primaryColor,
            }}
            aria-hidden="true"
          >
            {branding.name.trim().charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: branding.primaryColor }}
          >
            Ministry Profile from
          </p>
          <p className="mt-1 truncate font-serif text-xl font-medium text-foreground">
            {branding.name}
          </p>
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex" aria-hidden="true">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: branding.primaryColor }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: branding.accentColor }}
          />
        </div>
      </div>
    </div>
  );
}