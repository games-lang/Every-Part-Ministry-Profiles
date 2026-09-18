import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from "@/components/ui/button";

// Pages
import Home from '@/pages/public/home';
import HowItWorks from '@/pages/public/how-it-works';
import MinistryProfiles from '@/pages/public/ministry-profiles';
import Partfinder from '@/pages/public/partfinder';
import ForChurches from '@/pages/public/for-churches';
import WhyEveryPart from '@/pages/public/why-every-part';
import PricingPage from '@/pages/pricing';
import AboutEarlyAccess from '@/pages/about-early-access';
import { PrivacyPolicyPage, TermsOfServicePage } from '@/pages/policies';
import { AppAdminRoute } from '@/pages/app-admin';
import Dashboard from '@/pages/dashboard';
import LeadershipProfilePage from '@/pages/leadership-profile';
import ChurchSetup from '@/pages/church-setup';
import BillingPage from '@/pages/billing';
import ChurchOnboarding from '@/pages/church-onboarding';
import ProfilesList from '@/pages/profiles-list';
import ProfileDetail from '@/pages/profile-detail';
import Teams from '@/pages/teams';
import Assessment from '@/pages/assessment';
import AgeGateway from '@/pages/age-gateway';
import DiscoverGate from '@/pages/discover-gate';
import ExploreGate from '@/pages/explore-gate';
import DevelopGate from '@/pages/develop-gate';
import DiscoverAssessment from '@/pages/discover-assessment';
import ExploreAssessment from '@/pages/explore-assessment';
import DevelopAssessment from '@/pages/develop-assessment';
import DiscoverResult from '@/pages/discover-result';
import ExploreResult from '@/pages/explore-result';
import DevelopResult from '@/pages/develop-result';

import { LeaderJourneyPage, PublicJourneyPage } from '@/pages/journey';
import NotFound from '@/pages/not-found';
import { Shell } from '@/components/layout/Shell';
import { Brand } from '@/components/brand';
import { BetaNotice } from '@/components/beta-notice';
import { AppFeedbackForm } from "@/components/app-feedback-form";

const DiscoverRoute = ({ params }: { params: { slug: string } }) => (
    <DiscoverGate params={params} Page={DiscoverAssessment} />
  );

const ExploreRoute = ({ params }: { params: { slug: string } }) => (
    <ExploreGate params={params} Page={ExploreAssessment} />
  );

const DevelopRoute = ({ params }: { params: { slug: string } }) => (
    <DevelopGate params={params} Page={DevelopAssessment} />
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
const adminReturnStorageKey = "every-part:admin-return";
const adminPath = `${basePath}/app-admin`;

function rememberAdminReturn() {
  try {
    window.sessionStorage.setItem(adminReturnStorageKey, adminPath);
  } catch {
    // Continue with Clerk's normal fallback if session storage is unavailable.
  }
}

function getRememberedAdminReturn() {
  try {
    return window.sessionStorage.getItem(adminReturnStorageKey) === adminPath
      ? adminPath
      : null;
  } catch {
    return null;
  }
}

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
  const queryRedirect = new URLSearchParams(window.location.search).get("redirect_url");
  const requestedAdminRedirect = queryRedirect === adminPath || queryRedirect === "/app-admin";
  const rememberedAdminRedirect = getRememberedAdminReturn();
  const fallbackRedirectUrl = requestedAdminRedirect
    ? adminPath
    : rememberedAdminRedirect ?? `${basePath}/dashboard`;

  useEffect(() => {
    if (requestedAdminRedirect) rememberAdminReturn();
  }, [requestedAdminRedirect]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Brand className="mb-7 justify-center" />
        <div className="mb-5 overflow-hidden rounded-2xl border border-secondary/30 bg-secondary/10">
          <BetaNotice />
          <p className="px-5 pb-4 text-center text-xs leading-5 text-muted-foreground">
            We’re testing and improving Every Part over time. Thanks for helping
            us make it more useful for churches and leaders. Help us make it
            the best it can be by becoming one of our testing churches.
          </p>
        </div>
        <Show when="signed-out">
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            fallbackRedirectUrl={fallbackRedirectUrl}
          />
        </Show>
        <Show when="signed-in">
          <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm" aria-labelledby="already-signed-in-title">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">You’re already signed in</p>
            <h1 id="already-signed-in-title" className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
              Continue to your Every Part workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open the private EveryPart CEO inbox, or return to your church dashboard.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild className="rounded-full">
                <Link href="/app-admin">Open EveryPart CEO inbox</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard">Church dashboard</Link>
              </Button>
            </div>
          </section>
        </Show>
        <section className="mt-5 rounded-2xl border border-primary/15 bg-primary/[.04] p-5 shadow-sm sm:p-6" aria-labelledby="admin-inbox-title">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">EveryPart CEO</p>
          <h2 id="admin-inbox-title" className="mt-2 font-serif text-xl font-semibold tracking-tight text-foreground">
            Looking for the private EveryPart CEO inbox?
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Sign in first, then we’ll take you directly to suggestions and problem reports from pastors.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full border-primary/20 bg-background">
            <Link href="/app-admin">Open EveryPart CEO inbox</Link>
          </Button>
        </section>
        <AppFeedbackForm sourcePage="sign-in" className="mt-5" />
      </div>
    </div>
  );
}

function SignUpPage() {
  const fallbackRedirectUrl = `${basePath}/dashboard`;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Brand className="mb-7 justify-center" />
        <div className="mb-5 overflow-hidden rounded-2xl border border-secondary/30 bg-secondary/10">
          <BetaNotice />
          <p className="px-5 pb-4 text-center text-xs leading-5 text-muted-foreground">
            We’re testing and improving Every Part over time. Help us make it
            the best it can be by becoming one of our testing churches.
          </p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          fallbackRedirectUrl={fallbackRedirectUrl}
        />
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
      const previousUserId = prevUserIdRef.current;
      const isInitialAuthHydration =
        previousUserId === undefined ||
        (previousUserId === null && userId !== null);

      if (!isInitialAuthHydration && previousUserId !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  const pendingAdminReturn = getRememberedAdminReturn();

  return (
    <>
      <Show when="signed-in">
        <Redirect to={pendingAdminReturn ? "/app-admin" : "/dashboard"} />
      </Show>
      <Show when="signed-out">
        <Home />
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
              <Route path="/how-it-works" component={HowItWorks} />
              <Route path="/ministry-profiles" component={MinistryProfiles} />
              <Route path="/partfinder" component={Partfinder} />
              <Route path="/for-churches" component={ForChurches} />
              <Route path="/why-every-part" component={WhyEveryPart} />
              <Route path="/pricing" component={PricingPage} />
              <Route path="/about-early-access" component={AboutEarlyAccess} />
              <Route path="/privacy" component={PrivacyPolicyPage} />
              <Route path="/terms" component={TermsOfServicePage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/app-admin">
                <Show when="signed-in">
                  <AppAdminRoute />
                </Show>
                <Show when="signed-out">
                  <Redirect to={`/sign-in?redirect_url=${encodeURIComponent(adminPath)}`} />
                </Show>
              </Route>
              
              <Route path="/dashboard">
                <AuthenticatedRoute component={Dashboard} />
              </Route>
              <Route path="/church-setup">
                <AuthenticatedRoute component={ChurchSetup} />
              </Route>
              <Route path="/billing">
                <AuthenticatedRoute component={BillingPage} />
              </Route>
              <Route path="/leadership-profile">
                <AuthenticatedRoute component={LeadershipProfilePage} />
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
              <Route path="/profile/:slug/explore" component={ExploreRoute} />
              <Route path="/profile/:slug/develop" component={DevelopRoute} />
              <Route path="/discover/result/:token" component={DiscoverResult} />
              <Route path="/explore/result/:token" component={ExploreResult} />
              <Route path="/develop/result/:token" component={DevelopResult} />
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
