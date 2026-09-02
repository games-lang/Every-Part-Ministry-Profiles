import { useAuth } from "@clerk/react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DiscoverGate({
    params,
    Page,
}: {
    params: { slug: string };
    Page: React.ComponentType<{ params: { slug: string } }>;
}) {
    const { isSignedIn } = useAuth();
    const [location] = useLocation();
    const next = encodeURIComponent(location || `/profile/${params.slug}/discover`);

  
}
}
})