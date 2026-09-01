import { Show } from "@clerk/react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DiscoverGate({
  params,
  Page,
}: {
  params: { slug: string };
  Page: React.ComponentType<{ params: { slug: string } }>;
}) {
  const [location] = useLocation();
  const next = encodeURIComponent(location || `/profile/${params.slug}/discover`);
  return (
    <>
      <Show when="signed-in">
        <Page params={params} />
      </Show>
      <Show when="signed-out">
        <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
          <Card className="w-full max-w-md border-border/60 shadow-lg text-center">
            <CardContent className="p-8 y-4">
              <h2 className="text-xl font-serif font-medium">A parent or coordinator needs to sign in</h2>
              <p className="text-muted-foreground leading-relaxed">
                Discover (ages 6–8) is not open from the public link. Sign in, then continue.
              </p>
              <Button asChild className="w-full">
                <Link href={`/sign-in?redirect_url=${next}`}>Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/profile/${params.slug}`}>Return to start</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Show>
    </>
  );
}
