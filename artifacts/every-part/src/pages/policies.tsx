import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, LockKeyhole, Scale } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PolicyKind = "privacy" | "terms";

const policyCopy = {
  privacy: {
    eyebrow: "Every Part Privacy Policy",
    title: "Privacy, in plain language.",
    description:
      "Every Part helps churches have better conversations about how people may serve. This first-draft policy explains what information a church may keep in Every Part and how that information is treated.",
    updated: "First draft · September 2026",
    icon: LockKeyhole,
    sections: [
      {
        title: "Every Part is used by a church",
        paragraphs: [
          "Every Part is set up for a church to use with its people. Profiles belong to that church’s account and are not part of the public internet.",
          "Access is controlled by the church. People with church access may be able to see or discuss information according to the permissions and practices their church chooses.",
        ],
      },
      {
        title: "Information a church may store",
        paragraphs: [
          "Depending on how a church uses Every Part, a profile can include a person’s name and contact information, gifts and passions, availability, current serving load, pastoral notes, and spiritual-health-style answers.",
          "A church may also use Discover for children ages 6–8. Discover responses are collected only when an adult with church access is present.",
        ],
      },
      {
        title: "How we handle information",
        paragraphs: [
          "We do not sell personal data.",
          "Every Part is designed to keep church profiles behind church-controlled access rather than publishing them for anyone to find. Churches are responsible for choosing appropriate leaders, permissions, and ministry practices for the information they enter.",
        ],
      },
      {
        title: "Questions or deletion requests",
        paragraphs: [
          "A member can ask their church to delete their profile. The church can then handle that request according to its own records, ministry practices, and legal responsibilities.",
          "If you have a question about a profile, start by contacting the church that invited you to use Every Part. Questions about Every Part can be sent to hello@everypart.org.",
        ],
      },
    ],
  },
  terms: {
    eyebrow: "Every Part Terms of Service",
    title: "A clear understanding of the service.",
    description:
      "These plain-language terms describe what Every Part is, what churches are responsible for, and the limits of the service.",
    updated: "First draft · September 2026",
    icon: Scale,
    sections: [
      {
        title: "What Every Part is",
        paragraphs: [
          "Every Part is a conversation aid for church coordinators and leaders. It can help a church organize reflection and begin better conversations about serving.",
          "Every Part is not a system of record and is not volunteer-management software. It does not replace a church’s records, safeguarding practices, pastoral judgment, or conversations with its people.",
        ],
      },
      {
        title: "The church is responsible for its use",
        paragraphs: [
          "The church is responsible for how it collects, reviews, shares, and acts on member data in Every Part. This includes choosing who has access, getting any permissions or consent that are needed, and using information in a respectful and lawful way.",
          "The church is also responsible for checking information with people directly instead of treating a profile as a final answer about a person.",
        ],
      },
      {
        title: "Your information and your conversations",
        paragraphs: [
          "If a church invites you to use Every Part, your participation is part of that church’s ministry process. Questions about your profile or requests to remove it should be directed to your church.",
          "Please do not use Every Part to store information that your church is not prepared to protect or to discuss responsibly.",
        ],
      },
      {
        title: "No warranty",
        paragraphs: [
          "Every Part is provided as a helpful tool, but it is provided without a warranty. We do not promise that the service will always be available, error-free, complete, or suitable for every church or ministry decision.",
          "A church should use its own judgment and care when using Every Part. These terms are a first draft and are not legal advice.",
        ],
      },
      {
        title: "Questions",
        paragraphs: [
          "Questions about these terms or the service can be sent to hello@everypart.org.",
        ],
      },
    ],
  },
} satisfies Record<
  PolicyKind,
  {
    eyebrow: string;
    title: string;
    description: string;
    updated: string;
    icon: typeof LockKeyhole;
    sections: { title: string; paragraphs: string[] }[];
  }
>;

function PolicyFooter({ current }: { current: PolicyKind }) {
  return (
    <footer className="mt-16 border-t border-border/70 py-8">
      <div className="container mx-auto flex flex-col gap-5 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Every Part</p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label="Legal">
          <Link
            href="/privacy"
            aria-current={current === "privacy" ? "page" : undefined}
            className="hover:text-foreground hover:underline"
            data-testid="link-policy-footer-privacy"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            aria-current={current === "terms" ? "page" : undefined}
            className="hover:text-foreground hover:underline"
            data-testid="link-policy-footer-terms"
          >
            Terms of Service
          </Link>
          <a href="mailto:hello@everypart.org" className="hover:text-foreground hover:underline">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function PolicyPage({ kind }: { kind: PolicyKind }) {
  const copy = policyCopy[kind];
  const Icon = copy.icon;

  useEffect(() => {
    document.title = `${kind === "privacy" ? "Privacy Policy" : "Terms of Service"} | Every Part`;

    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", copy.description);
    return () => {
      document.title = "Every Part";
    };
  }, [copy.description, kind]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/80 bg-background/95">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="rounded-xl" aria-label="Every Part home">
            <Brand compact />
          </Link>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 text-accent">
            <Icon className="h-5 w-5" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[.18em]">{copy.eyebrow}</p>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-.05em] sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">{copy.updated}</p>
        </div>

        <Card className="mt-10 border-secondary/40 bg-secondary/10 shadow-sm">
          <CardContent className="flex gap-3 p-5 leading-7 text-foreground sm:p-6">
            <FileText className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <p>
              This is a first-draft policy for clarity while Every Part is being
              developed. It is not legal advice.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-5">
          {copy.sections.map((section) => (
            <Card key={section.title} className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-2xl tracking-[-.03em]">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <PolicyFooter current={kind} />
    </div>
  );
}

export function PrivacyPolicyPage() {
  return <PolicyPage kind="privacy" />;
}

export function TermsOfServicePage() {
  return <PolicyPage kind="terms" />;
}