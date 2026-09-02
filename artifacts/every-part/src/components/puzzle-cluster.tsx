import { Puzzle } from "lucide-react";

type PuzzleClusterProps = {
  size?: "sm" | "lg";
  className?: string;
};

const pieces = [
  "text-[hsl(var(--primary))]",
  "text-[hsl(var(--chart-2))]",
  "text-[hsl(var(--chart-3))]",
  "text-[hsl(var(--secondary))]",
];

export function PuzzleCluster({ size = "lg", className = "" }: PuzzleClusterProps) {
  return (
    <div className={`puzzle-cluster puzzle-cluster--${size} ${className}`} aria-hidden="true">
      {pieces.map((tone, index) => (
        <Puzzle
          key={tone}
          className={`puzzle-cluster__piece ${tone} ${index % 2 ? "puzzle-cluster__piece--offset" : ""}`}
          strokeWidth={1.35}
          fill="currentColor"
        />
      ))}
    </div>
  );
}