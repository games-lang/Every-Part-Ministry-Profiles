import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <h1 className="font-serif text-6xl md:text-8xl font-bold text-primary">
          404
        </h1>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground">
          Page not found
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We couldn't find the page you're looking for. It might have been moved or the link might be broken.
        </p>
        <Button asChild className="rounded-full px-8 h-12">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
