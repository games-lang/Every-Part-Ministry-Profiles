import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { useGetPublicChurch, useGetChurchAdminAccess, getGetChurchAdminAccessQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronRight, User, AlertCircle } from "lucide-react";
import { PuzzleCluster } from "@/components/puzzle-cluster";
import { differenceInYears, isValid, parseISO } from "date-fns";

export default function AgeGateway({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  
  const { data: church, isLoading: churchLoading } = useGetPublicChurch(slug);
  const { data: adminAccess } = useGetChurchAdminAccess(slug, { 
    query: { 
      enabled: !!isSignedIn && !!slug,
      queryKey: getGetChurchAdminAccessQueryKey(slug)
    } 
  });
  
  const [birthdate, setBirthdate] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [mode, setMode] = useState<"age" | "birthdate">("age");
  const [error, setError] = useState("");

  const canOverride = adminAccess?.canOverrideYouthPathway;

  const calculatePathway = (years: number) => {
    if (years < 6) return "too-young";
    if (years <= 8) return "discover";
    if (years <= 12) return "explore";
    if (years <= 17) return "develop";
    return "adult";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let calculatedAge: number;

    if (mode === "birthdate") {
      const date = parseISO(birthdate);
      if (!isValid(date)) {
        setError("Please enter a valid birthdate.");
        return;
      }
      calculatedAge = differenceInYears(new Date(), date);
    } else {
      calculatedAge = Number(age);
      if (isNaN(calculatedAge) || calculatedAge <= 0) {
        setError("Please enter a valid age.");
        return;
      }
    }

    const pathway = calculatePathway(calculatedAge);

    if (pathway === "discover" && !isSignedIn) {
            setError("A parent or coordinator must sign in");
            return;
    }
    
    if (pathway === "too-young") {
      setError("This version begins at age 6.");
      return;
    }

    // Build the redirect URL including the age so the next page can use it
    const searchParams = new URLSearchParams();
    searchParams.set("age", calculatedAge.toString());
    if (mode === "birthdate") {
      searchParams.set("birthdate", birthdate);
    }

    setLocation(`/profile/${slug}/${pathway}?${searchParams.toString()}`);
  };

  if (churchLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!church) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/20 shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-serif font-medium mb-2">Church not found</h2>
            <p className="text-muted-foreground">Please check the link and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overrideLink = (path: string, label: string, defaultAge: number) => (
    <Button 
      variant="outline" 
      className="w-full justify-between"
      onClick={() => setLocation(`/profile/${slug}/${path}?age=${defaultAge}`)}
    >
      {label}
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Button>
  );

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center overflow-hidden py-12 px-4 bg-background ep-landing">
      <PuzzleCluster className="pointer-events-none absolute -right-10 top-10 opacity-25" />
      <PuzzleCluster size="sm" className="pointer-events-none absolute -bottom-2 -left-4 opacity-20" />
      <div className="w-full max-w-md space-y-8 landing-reveal">
        <div className="text-center space-y-4">
          {church.logoUrl ? (
            <img src={church.logoUrl} alt={church.name} className="h-16 mx-auto object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">
            {church.name} Ministry Profile
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Every Part helps us have warm, careful conversations about how people may enjoy serving.
          </p>
        </div>

        <Card className="shadow-lg border-border/60 landing-reveal-delay">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-medium mb-6">Let's get started</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                  <button
                    type="button"
                    onClick={() => setMode("age")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      mode === "age" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Age
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("birthdate")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      mode === "birthdate" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Birthdate
                  </button>
                </div>

                {mode === "age" ? (
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                      placeholder="e.g., 8, 14, 35"
                      className="text-lg py-6"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Birthdate</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        id="birthdate"
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="pl-10 text-lg py-6"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full text-base font-medium">
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {canOverride && (
          <div className="landing-reveal-delay-2">
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Admin Override</span>
              <div className="h-px bg-border flex-1" />
            </div>
            
            <div className="space-y-2">
              {overrideLink("discover", "Discover (Age 6-8)", 8)}
              {overrideLink("explore", "Explore (Age 9-12)", 12)}
              {overrideLink("develop", "Develop (Age 13-17)", 16)}
              {overrideLink("adult", "Adult (Age 18+)", 18)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
