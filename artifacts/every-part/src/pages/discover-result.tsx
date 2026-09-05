import { useGetDiscoverResult, getGetDiscoverResultQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Sparkles, Star, Loader2, ArrowRight } from "lucide-react";
import { ChurchProfileBranding } from "@/components/church-profile-branding";

export default function DiscoverResult({ params }: { params: { token: string } }) {
  const { token } = params;
  
  const { data: result, isLoading, error } = useGetDiscoverResult(token, {
    query: { 
      enabled: !!token, 
      queryKey: getGetDiscoverResultQueryKey(token) 
    }
  });

  if (isLoading) {
    return (
      <div className="pathway-theme pathway-theme-discover min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="pathway-theme pathway-theme-discover min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/20 shadow-sm">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-serif font-medium mb-2 text-destructive">Result Not Found</h2>
            <p className="text-muted-foreground">We couldn't load the profile result. The link may have expired or is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pathway-theme pathway-theme-discover min-h-[100dvh] flex items-center justify-center py-12 px-4 bg-background ep-landing">
      <div className="w-full max-w-2xl space-y-8 landing-reveal">
        <ChurchProfileBranding branding={result.branding} />

        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto text-secondary mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-foreground">
            Thank you, {result.childName}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            You did a great job exploring how God made you.
          </p>
        </div>

        <Card className="shadow-xl border-border/60 overflow-hidden landing-reveal-delay">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardContent className="p-8 sm:p-10 space-y-8">
            
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-serif font-medium text-foreground">
                {result.summary.headline}
              </h2>
            </div>

            {result.summary.strengths.length > 0 && (
              <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                <h3 className="font-medium flex items-center gap-2 mb-4 text-foreground justify-center">
                  <Star className="w-5 h-5 text-secondary" />
                  Things we noticed about you
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {result.summary.strengths.map((strength, i) => (
                    <span key={i} className="px-4 py-2 bg-background border border-border/60 rounded-full text-sm font-medium shadow-sm">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
              <h3 className="font-medium flex items-center gap-2 mb-3 text-primary">
                <Heart className="w-5 h-5" />
                What's next?
              </h3>
              <p className="text-foreground/80 leading-relaxed">
                {result.summary.nextStep}
              </p>
            </div>

            <div className="text-center space-y-4 pt-4 border-t border-border/40">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto italic">
                {result.summary.tentativeNote}
              </p>
            </div>

          </CardContent>
        </Card>

        <div className="text-center landing-reveal-delay-2">
          <p className="text-sm text-muted-foreground mb-6">
            A copy of this profile has been shared with approved ministry leaders.
          </p>
          <div className="flex flex-col items-center gap-3">
            {result.journeyToken && <Button asChild className="h-12 px-6"><Link href={`/journey/${result.journeyToken}`}>Open your ministry journey<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>}
            <Button asChild variant="outline" className="h-12 px-6">
              <Link href="/">
                Return to Homepage
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
