import { Link } from "wouter";

type BrandProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function Brand({ compact = false, href, className = "" }: BrandProps) {
  const logo = (
    <span className={`inline-flex items-center ${className}`} aria-label="Every Part">
      <svg
        viewBox="0 0 230 64"
        role="img"
        aria-label="Every Part"
        className={compact ? "h-9 w-auto" : "h-11 w-auto"}
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8"
        >
          <path
            d="M30 18V31M30 23L16 11M30 23L44 11"
            stroke="hsl(var(--accent))"
          />
          <path
            d="M44 32H31M40 32L52 19M40 32L52 45"
            stroke="hsl(var(--secondary))"
          />
          <path
            d="M30 46V33M30 41L16 53M30 41L44 53"
            stroke="hsl(var(--primary))"
          />
          <path
            d="M16 32H29M20 32L8 19M20 32L8 45"
            stroke="hsl(var(--chart-3))"
          />
        </g>
        <circle cx="30" cy="8" r="7" fill="hsl(var(--accent))" />
        <circle cx="56" cy="32" r="7" fill="hsl(var(--secondary))" />
        <circle cx="30" cy="56" r="7" fill="hsl(var(--primary))" />
        <circle cx="4" cy="32" r="7" fill="hsl(var(--chart-3))" />
        <circle cx="30" cy="32" r="4" fill="hsl(var(--background))" />
        <text
          x="76"
          y="41"
          fill="hsl(var(--primary))"
          fontFamily="var(--app-font-serif)"
          fontSize="25"
          fontWeight="600"
          letterSpacing="-0.8"
        >
          Every Part
        </text>
      </svg>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Every Part home" className="inline-flex rounded-xl">
        {logo}
      </Link>
    );
  }

  return logo;
}