import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export function Under13Unavailable({ slug }: { slug: string }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
      <Card className="w-full max-w-md border-border/60 shadow-lg text-center">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-serif font-medium">Coming in a future release</h2>
          <p className="text-muted-foreground">
            Discover and Explore aren&apos;t available yet. Please check with your church leader about a future release.
          </p>
          <Link href={`/profile/${slug}`} className="inline-block font-medium text-primary underline">
            Back to your church&apos;s profile page
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
