import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("assistant status is configured-only, distinguishes paused, and links to saved context", () => {
  const assistant = source("./partfinder-assistant.tsx");
  assert.match(assistant, /useGetPartFinderLeadershipProfile\(\{[\s\S]*?enabled: open, staleTime: 0/);
  assert.match(assistant, /leadershipProfile\?\.configured && \([\s\S]*?href="\/leadership-profile"/);
  assert.match(assistant, /leadershipProfile.personalizationEnabled[\s\S]*?"Personalized by your My Leadership profile"[\s\S]*?"Personalization paused"/);
  assert.match(assistant, /onClick=\{\(\) => setOpen\(false\)\}/);
});

test("privacy disclosure and registered help describe only implemented personalization", () => {
  assert.match(source("../pages/leadership-profile.tsx"), /What you write here is shared with the AI assistant to personalize guidance — please avoid sensitive personal details about other people\./);
  const articles = source("../help/articles.ts");
  assert.match(articles, /section\("Managing people and teams", \[[\s\S]*?\["my-leadership-profile", "My Leadership and PartFinder"\]/);
  const article = source("../help/articles/my-leadership-profile.md");
  for (const text of [
    "Separate from your Ministry Profile", "Find-people prioritization",
    "Team suggestions", "Pause personalization", "balanced style and standard answer length",
    "leadership text is compared locally and is not sent to the AI",
  ]) assert.ok(article.includes(text), text);
  assert.match(article, /unassigned list and church-wide insights are not personalized/);
});
