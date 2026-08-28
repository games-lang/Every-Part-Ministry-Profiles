import { useRoute, Link } from "wouter";
import { useGetProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Mail, Phone, Calendar, Heart, Map, Clock, Briefcase, Printer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ProfileDetail() {
  const [, params] = useRoute("/profiles/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: profile, isLoading, error } = useGetProfile(id, { query: { enabled: !!id, queryKey: getGetProfileQueryKey(id) } });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          Failed to load profile details.
        </div>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/profiles"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Profiles</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const { basicInformation, churchConnection, skills, passions, interests, availability, servingFrequency } = profile;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 print:p-0 print:m-0 print:w-full print:max-w-none">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" asChild className="font-medium -ml-4">
          <Link href="/profiles">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </Button>
        <Button onClick={() => window.print()} variant="outline" className="font-medium">
          <Printer className="w-4 h-4 mr-2" />
          Print Profile
        </Button>
      </div>

      {/* Profile Header */}
      <div className="bg-card border border-border/60 rounded-2xl p-8 md:p-10 shadow-sm print:border-none print:shadow-none print:p-0 print:mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-4xl shrink-0">
            {profile.memberName.charAt(0)}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="font-serif text-4xl font-medium tracking-tight mb-2">{profile.memberName}</h1>
              <p className="text-muted-foreground text-lg">
                Completed {new Date(profile.completedAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${profile.email}`} className="hover:text-primary">{profile.email}</a>
              </div>
              {basicInformation.phone && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${basicInformation.phone}`} className="hover:text-primary">{basicInformation.phone}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 print:block print:space-y-8">
        
        {/* Passions & Interests (Left Column) */}
        <div className="space-y-8 print:mb-8">
          <section>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-medium mb-4">
              <Heart className="w-5 h-5 text-secondary" /> Passions
            </h2>
            <div className="flex flex-wrap gap-2">
              {passions.map(p => (
                <Badge key={p} className="bg-secondary/15 text-secondary-foreground hover:bg-secondary/20 text-sm px-3 py-1">
                  {p}
                </Badge>
              ))}
            </div>
          </section>

          <Separator className="print:hidden" />

          <section>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-medium mb-4">
              <Map className="w-5 h-5 text-primary" /> Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {interests.map(i => (
                <Badge key={i} variant="outline" className="bg-card text-sm px-3 py-1">
                  {i}
                </Badge>
              ))}
            </div>
          </section>
          
          <Separator className="print:hidden" />

          <section>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-medium mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" /> Availability
            </h2>
            <Card className="border-border/60 shadow-none">
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground font-medium mb-1">Frequency</div>
                  <div className="font-medium">{servingFrequency || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium mb-1">Times</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {availability.map(a => (
                      <Badge key={a} variant="secondary" className="bg-muted text-muted-foreground text-xs">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Experience & Connection (Right Column) */}
        <div className="space-y-8">
          <section className="bg-primary text-primary-foreground rounded-2xl p-6 print:border print:border-gray-300 print:text-black print:bg-white">
            <h2 className="font-serif text-xl font-medium mb-4">Church Connection</h2>
            <div className="space-y-4">
              <div>
                <div className="text-primary-foreground/70 text-sm print:text-gray-500">Following Jesus</div>
                <div className="font-medium">{churchConnection.followingJesusLength}</div>
              </div>
              <div>
                <div className="text-primary-foreground/70 text-sm print:text-gray-500">Attending</div>
                <div className="font-medium">{churchConnection.attendanceLength}</div>
              </div>
              <div>
                <div className="text-primary-foreground/70 text-sm print:text-gray-500">Connection Level (1-5)</div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className={`w-8 h-2 rounded-full ${level <= churchConnection.connectionLevel ? 'bg-secondary' : 'bg-primary-foreground/20 print:bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-medium mb-4">
              <Briefcase className="w-5 h-5 text-muted-foreground" /> Skills & Experience
            </h2>
            <div className="space-y-4">
              {skills.occupation && (
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Occupation</div>
                  <div>{skills.occupation}</div>
                </div>
              )}
              {skills.uniqueSkills && (
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Unique Skills</div>
                  <div>{skills.uniqueSkills}</div>
                </div>
              )}
              {skills.previousMinistryExperience && (
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Previous Ministry Experience</div>
                  <div>{skills.previousMinistryExperience}</div>
                </div>
              )}
              {skills.leadershipExperience && (
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Leadership Experience</div>
                  <div>{skills.leadershipExperience}</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
