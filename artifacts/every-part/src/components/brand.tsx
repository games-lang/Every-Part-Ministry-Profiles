import { Link } from "wouter";

const logoSrc = `${import.meta.env.BASE_URL}every-part-logo.png`;

type BrandProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function Brand({ compact = false, href, className = "" }: BrandProps) {
  const logo = (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Every Part"
        className={compact ? "h-9 w-auto" : "h-11 w-auto"}
      />
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