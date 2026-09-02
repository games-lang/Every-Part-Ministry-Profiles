import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Pages
import LandingPage from '@/pages/landing';
import PricingPage from '@/pages/pricing';
import Dashboard from '@/pages/dashboard';
import ChurchSetup from '@/pages/church-setup';
import ChurchOnboarding from '@/pages/church-onboarding';
import ProfilesList from '@/pages/profiles-list';
import ProfileDetail from '@/pages/profile-detail';
import Teams from '@/pages/teams';
import Assessment from '@/pages/assessment';
import AgeGateway from '@/pages/age-gateway';
import YouthPathwayStub from '@/pages/youth-pathway-stub';
import DiscoverGate from '@/pages/discover-gate';
import DiscoverAssessment from '@/pages/discover-assessment';
import ExploreAssessment from '@/pages/explore-assessment';

import { LeaderJourneyPage, PublicJourneyPage } from '@/pages/journey';
import NotFound from '@/pages/not-found';
import { Shell } from '@/components/layout/Shell';
import { Brand } from '@/components/brand';

const DiscoverRoute = ({ params }: { params: { slug: string } }) => (
    <DiscoverGate params={params} Page={DiscoverAssessment} />
  );

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(220 58% 17%)",
    colorForeground: "hsl(220 58% 17%)",
    colorMutedForeground: "hsl(217 20% 41%)",
    colorDanger: "hsl(0 70% 45%)",
    colorBackground: "hsl(180 22% 96%)",
    colorInput: "hsl(180 20% 91%)",
    colorInputForeground: "hsl(220 58% 17%)",
    colorNeutral: "hsl(215 25% 82%)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card border border-border shadow-md rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl font-semibold tracking-tight text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-medium text-foreground",
    formFieldLabel: "font-medium text-foreground",
    footerActionLink: "text-primary font-medium hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground bg-card",
    identityPreviewEditButton: "text-primary hover:bg-muted/50",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium",
  },
};

function SignInPage() {
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "fix">("suggestion");
  const [feedback, setFeedback] = useState("");

  const feedbackSubject =
    feedbackType === "suggestion"
      ? "Every Part suggestion"
      : "Every Part issue to fix";
  const feedbackBody = feedback.trim()
    ? `${feedback.trim()}\n\nSent from the Every Part sign-in page.`
    : "";
  const feedbackHref = feedbackBody
    ? `mailto:hello@everypart.org?subject=${encodeURIComponent(feedbackSubject)}&body=${encodeURIComponent(feedbackBody)}`
    : undefined;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Brand className="mb-7 justify-center" />
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        <section
          className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
          aria-labelledby="sign-in-feedback-title"
          data-testid="card-sign-in-feedback"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-primary" aria-hidden="true">
              <span className="text-lg">✦</span>
            </span>
            <div>
              <h2 id="sign-in-feedback-title" className="font-serif text-xl font-semibold tracking-tight text-foreground">
                Help us make Every Part better
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Have a suggestion or something that needs fixing? Share it before or after you sign in.
              </p>
            </div>
          </div>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (feedbackHref) {
                window.location.href = feedbackHref;
              }
            }}
          >
            <div>
              <label htmlFor="sign-in-feedback-type" className="text-sm font-medium text-foreground">
                What would you like to share?
              </label>
              <select
                id="sign-in-feedback-type"
                value={feedbackType}
                onChange={(event) => setFeedbackType(event.target.value as "suggestion" | "fix")}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                data-testid="select-sign-in-feedback-type"
              >
                <option value="suggestion">A suggestion</option>
                <option value="fix">A problem to fix</option>
              </select>
            </div>
            <div>
              <label htmlFor="sign-in-feedback-message" className="text-sm font-medium text-foreground">
                Tell us what you’re thinking
              </label>
              <textarea
                id="sign-in-feedback-message"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="What would make Every Part more useful or easier to use?"
                rows={4}
                required
                className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
                data-testid="textarea-sign-in-feedback-message"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                This opens your email app with a draft addressed to Every Part.
              </p>
              <button
                type="submit"
                disabled={!feedback.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
                data-testid="button-send-sign-in-feedback"
              >
                Open email draft
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Brand className="mb-7 justify-center" />
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function AuthenticatedRoute({ component: Component }: { component: React.ElementType }) {
  return (
    <>
      <Show when="signed-in">
        <Shell>
          <Component />
        </Shell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/pricing" component={PricingPage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              
              <Route path="/dashboard">
                <AuthenticatedRoute component={Dashboard} />
              </Route>
              <Route path="/church-setup">
                <AuthenticatedRoute component={ChurchSetup} />
              </Route>
              <Route path="/church-onboarding">
                <AuthenticatedRoute component={ChurchOnboarding} />
              </Route>
              <Route path="/profiles">
                <AuthenticatedRoute component={ProfilesList} />
              </Route>
              <Route path="/profiles/:id/journey">
                <AuthenticatedRoute component={LeaderJourneyPage} />
              </Route>
              <Route path="/profiles/:id">
                <AuthenticatedRoute component={ProfileDetail} />
              </Route>
              <Route path="/teams">
                <AuthenticatedRoute component={Teams} />
              </Route>
              
              <Route path="/profile/:slug" component={AgeGateway} />
              <Route path="/profile/:slug/adult" component={Assessment} />
              <Route path="/profile/:slug/discover" component={DiscoverRoute} />
              <Route path="/profile/:slug/explore" component={ExploreAssessment} />
              <Route path="/profile/:slug/develop" component={YouthPathwayStub} />
              <Route path="/discover/result/:token" component={YouthPathwayStub} />
              <Route path="/explore/result/:token" component={YouthPathwayStub} />
              <Route path="/develop/result/:token" component={YouthPathwayStub} />
              <Route path="/journey/:token" component={PublicJourneyPage} />
              
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
