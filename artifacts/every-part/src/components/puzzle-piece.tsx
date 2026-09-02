type PuzzlePieceProps = {
  children: React.ReactNode;
  tone: "navy" | "teal" | "sage" | "gold";
  className?: string;
};

const puzzlePath =
  "M24 0H106C106 10 114 18 124 18C134 18 142 10 142 0H276V76C264 76 256 84 256 94C256 104 264 112 276 112V240H188C188 228 180 220 170 220C160 220 152 228 152 240H24V160C36 160 44 152 44 140C44 128 36 120 24 120V0Z";

export function PuzzlePiece({ children, tone, className = "" }: PuzzlePieceProps) {
  return (
    <article className={`pathway-puzzle-piece pathway-puzzle-piece--${tone} ${className}`}>
      <svg
        className="pathway-puzzle-piece__shape"
        viewBox="0 0 300 240"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={puzzlePath} />
      </svg>
      <div className="relative z-10 flex min-h-[300px] flex-col p-7 sm:p-8">
        {children}
      </div>
    </article>
  );
}