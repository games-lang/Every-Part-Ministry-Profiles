import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Map, ArrowLeft } from "lucide-react";

export default function DevelopPlaceholder({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
      <Card className="w-full max-w-md border-border/60 shadow-lg text-center landing-reveal">
        <CardContent className="p-8">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
            <Map className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-serif font-medium mb-3">Develop Profile</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The Develop pathway for ages 13-17 is currently under development. 
            Check back later as we continue to expand Every Part.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/profile/${params.slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to start
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
