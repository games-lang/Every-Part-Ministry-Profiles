export type HelpArticle = {
  slug: string;
  title: string;
  section: string;
  content: string;
};

const markdown = import.meta.glob("./articles/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function section(title: string, entries: [slug: string, title: string][]) {
  return {
    title,
    articles: entries.map(([slug, articleTitle]): HelpArticle => {
      const content = markdown[`./articles/${slug}.md`];
      if (!content) throw new Error(`Missing Help article: ${slug}`);
      return { slug, title: articleTitle, section: title, content };
    }),
  };
}

export const HELP_SECTIONS = [
  section("Getting started", [
    ["set-up-your-church", "Set up your church"],
    ["invite-first-people", "Invite your first people"],
    ["read-first-results", "Read your first results"],
  ]),
  section("Inviting participants", [
    ["private-invitations", "Private invitations"],
    ["assessment-link", "Share the assessment link"],
    ["participant-experience", "What participants see"],
  ]),
  section("Understanding results", [
    ["leader-view-and-chapters", "Leader View and profile chapters"],
    ["response-patterns", "What stood out in your responses"],
    ["follow-up-conversation", "Have the follow-up conversation"],
  ]),
  section("Managing people and teams", [
    ["people-directory", "The People directory"],
    ["teams-and-removal", "Teams and removing a person"],
  ]),
  section("Plans and billing", [
    ["plans-and-limits", "Plans, usage, and limits"],
    ["billing-and-changes", "Invoices and plan changes"],
  ]),
  section("Privacy and data", [
    ["participant-data-and-deletion", "Participant data and deletion"],
    ["ai-in-results", "How AI is used"],
  ]),
  section("Troubleshooting", [
    ["drafts-and-resume", "Drafts and resume"],
    ["invite-email-not-received", "Invite email not received"],
    ["assessment-formats", "Which assessment format will people see?"],
  ]),
];