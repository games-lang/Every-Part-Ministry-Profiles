import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListProfiles } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, User, Mail, Calendar } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function ProfilesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // We fetch all and filter locally for a smoother UX, though the API supports params
  const { data: profiles, isLoading, error } = useListProfiles({ search: debouncedSearch || undefined });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          Failed to load profiles. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Ministry Profiles</h1>
          <p className="text-muted-foreground mt-1">Review and search member assessments.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by name, email, or skills..." 
            className="pl-9 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* We would wire up filters here if we had more time/data structures */}
        <Button variant="outline" className="shrink-0 font-medium">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group">
              <Link href={`/profiles/${profile.id}`} className="block p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-xl font-medium group-hover:text-primary transition-colors">
                        {profile.memberName}
                      </h3>
                      <div className="md:hidden">
                        <Button variant="secondary" size="sm">View</Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {profile.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(profile.completedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3">
                      {profile.passions && profile.passions.slice(0, 2).map((passion) => (
                        <Badge key={passion} variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20">
                          {passion}
                        </Badge>
                      ))}
                      {profile.interests && profile.interests.slice(0, 2).map((interest) => (
                        <Badge key={interest} variant="outline" className="bg-background">
                          {interest}
                        </Badge>
                      ))}
                      {((profile.passions?.length || 0) > 2 || (profile.interests?.length || 0) > 2) && (
                        <Badge variant="outline" className="text-muted-foreground border-dashed">
                          +{Math.max(0, (profile.passions?.length || 0) - 2) + Math.max(0, (profile.interests?.length || 0) - 2)} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="hidden md:block shrink-0">
                    <Button variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      View Profile
                    </Button>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border/60">
          <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-serif text-xl font-medium mb-2">No profiles found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms." : "Share your church assessment link to get started."}
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
