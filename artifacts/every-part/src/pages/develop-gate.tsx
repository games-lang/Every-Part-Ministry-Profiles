import { useAuth } from "@clerk/react";
import { Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DevelopGate({
  params,
  Page,
}: {
  params: { slug: string };
  Page: React.ComponentType<{ params: { slug: string } }>;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [location] = useLocation();
  const next = encodeURIComponent(location || `/profile/${params.slug}/develop`);

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
        <Card className="w-full max-w-md border-border/60 shadow-lg text-center">
          <CardContent className="p-8 space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-label="Checking access" />
            <p className="text-sm text-muted-foreground">Checking access…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSignedIn === true) {
    return <Page params={params} />;
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
      <Card className="w-full max-w-md border-border/60 shadow-lg text-center">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-serif font-medium">Open Develop</h2>
          <p className="text-muted-foreground leading-relaxed">
            A parent or coordinator must sign in before opening Develop.
          </p>
          <Button asChild className="w-full">
            <Link href={`/sign-in?redirect_url=${next}`}>Sign in as a parent or coordinator</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/profile/${params.slug}`}>Return to start</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}