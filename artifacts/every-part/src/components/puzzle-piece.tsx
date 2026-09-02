type PuzzlePieceProps = {
  children: React.ReactNode;
  tone: "navy" | "teal" | "sage" | "gold";
  variant?: "forward" | "reverse";
  className?: string;
};

const puzzlePath =
  "M24 0H106C106 16 114 26 124 26C134 26 142 16 142 0H276V76C260 76 250 84 250 94C250 104 260 112 276 112V240H188C188 224 180 214 170 214C160 214 152 224 152 240H24V160C40 160 50 152 50 140C50 128 40 120 24 120V0Z";

export function PuzzlePiece({ children, tone, variant = "forward", className = "" }: PuzzlePieceProps) {
  return (
    <article className={`pathway-puzzle-piece pathway-puzzle-piece--${tone} ${className}`}>
      <svg
        className="pathway-puzzle-piece__shape"
        viewBox="0 0 300 240"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={puzzlePath} transform={variant === "reverse" ? "rotate(180 150 120)" : undefined} />
      </svg>
      <div className="relative z-10 flex min-h-[250px] flex-col px-12 py-6 sm:min-h-[260px] sm:px-14 sm:py-7">
        {children}
      </div>
    </article>
  );
}