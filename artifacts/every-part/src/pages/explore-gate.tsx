import { useAuth } from "@clerk/react";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import {
  getGetPublicChurchQueryKey,
  useGetPublicChurch,
  useVerifyDiscoverAccess,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ExploreGate({
  params,
  Page,
}: {
  params: { slug: string };
  Page: React.ComponentType<{ params: { slug: string }; hallwayCode?: string }>;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [location] = useLocation();
  const [hallwayCode, setHallwayCode] = useState("");
  const [acceptedAccess, setAcceptedAccess] = useState<{
    slug: string;
    hallwayCode: string;
  } | null>(null);
  const [error, setError] = useState("");
  const { data: church, isLoading: churchLoading } = useGetPublicChurch(params.slug, {
    query: {
      queryKey: getGetPublicChurchQueryKey(params.slug),
      retry: 1,
    },
  });
  const verifyAccess = useVerifyDiscoverAccess();
  const next = encodeURIComponent(location || `/profile/${params.slug}/explore`);
  const hasAcceptedAccess =
    church?.discoverAccessAvailable === true &&
    acceptedAccess?.slug === params.slug;

  if (isLoaded && isSignedIn === true) {
    return <Page params={params} />;
  }

  if (!isLoaded || churchLoading) {
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

  if (hasAcceptedAccess) {
    return <Page params={params} hallwayCode={acceptedAccess.hallwayCode} />;
  }

  const hasHallwayCode = church?.discoverAccessAvailable === true;

  const submitCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    verifyAccess.mutate(
      {
        slug: params.slug,
        data: { hallwayCode },
      },
      {
        onSuccess: () =>
          setAcceptedAccess({ slug: params.slug, hallwayCode }),
        onError: () => setError("That code did not work. Check it with your church and try again."),
      },
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
      <Card className="w-full max-w-md border-border/60 shadow-lg text-center">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-serif font-medium">Open Explore</h2>
          <p className="text-muted-foreground leading-relaxed">
            {hasHallwayCode
              ? "Enter the code shared by your church, or sign in as a parent or coordinator."
              : "Sign in as a parent or coordinator to open Explore."}
          </p>
          {hasHallwayCode && (
            <>
              <form onSubmit={submitCode} className="space-y-3 text-left">
                <div className="space-y-2">
                  <Label htmlFor="explore-hallway-code">Church hallway code</Label>
                  <Input
                    id="explore-hallway-code"
                    value={hallwayCode}
                    onChange={(event) =>
                      setHallwayCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6))
                    }
                    placeholder="e.g. 7KQ4MZ"
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={6}
                    aria-describedby={error ? "explore-code-error" : undefined}
                  />
                </div>
                {error && (
                  <p id="explore-code-error" className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={verifyAccess.isPending || hallwayCode.length !== 6}>
                  {verifyAccess.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue with code
                </Button>
              </form>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <span className="relative bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">or</span>
              </div>
            </>
          )}
          <Button asChild className="w-full">
            <Link href={`/sign-in?redirect_url=${next}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/profile/${params.slug}`}>Return to start</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}