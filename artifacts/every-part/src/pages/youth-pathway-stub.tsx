import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function YouthPathwayStub({ params }: { params?: { slug?: string; token?: string } }) {
  const slug = params?.slug;
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
      <Card className="w-full max-w-md border-border/60 shadow-lg text-center landing-reveal">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-serif font-medium">This pathway isn&apos;t open yet</h2>
          <p className="text-muted-foreground leading-relaxed">
            We don&apos;t collect children&apos;s information on a public form. If you&apos;re a parent or guardian, talk with a ministry leader at your church.
          </p>
          {slug ? (
            <>
              <Button asChild className="w-full">
                <Link href={`/profile/${slug}`}>Return to start</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/profile/${slug}/adult`}>Adult ministry profile</Link>
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/">Back home</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
