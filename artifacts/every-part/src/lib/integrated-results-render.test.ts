import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Hand } from "lucide-react";
import { IntegratedAreaResults } from "../components/profile/integrated-area-results";
import { ServingPatternCard } from "../components/profile/serving-pattern-card";
import { ProfileInfographic } from "../components/profile/infographic/profile-infographic";
import { integratedResults } from "./integrated-results";

const yes = () => true;
const giftNames = ["Administration", "Apostleship", "Giving", "Faith", "Hospitality", "Mercy", "Teaching", "Wisdom"];
const profile = {
  memberName: "Test Participant",
  assessmentConfiguration: { sections: {}, subsections: {} },
  assessmentSections: { spiritualHealth: { prayer: "Growing" } },
  servingFrequency: "Monthly",
  availability: ["Saturday"],
  branding: {},
  integratedAssessment: {
    version: "integrated-assessment-v1",
    bankVersion: "adult-integrated-83-v1",
    scoringVersion: "independent-weighted-mean-v1",
    snapshot: { enabledSpiritualGifts: [...giftNames, "Healing", "Discernment of Spirits"] },
    constructs: [
      ...giftNames.map(construct => ({ category: "Gift", construct, mean: 4, answeredCount: 3, eligible: true, evidence: "sufficient" })),
      { category: "APEST", construct: "Teacher", mean: null, answeredCount: 1, eligible: false, evidence: "insufficient" },
      { category: "Strength", construct: "Listening", mean: 4, answeredCount: 3, eligible: true, evidence: "sufficient" },
      { category: "Personality", construct: "Social Energy", mean: null, answeredCount: 2, eligible: false, evidence: "insufficient", poles: ["Reflective", "Interactive"] },
    ],
    optionalExperiences: [{ construct: "Healing", answer: "PRIVATE OPTIONAL RESPONSE", text: "PRIVATE PROMPT" }],
    conversationOnlyGifts: ["Discernment of Spirits"],
  },
};
const results = integratedResults(profile, yes, yes)!;
const props = {
  profile,
  synthesis: {
    integrated: results, apestResult: null, ministryTendency: null, topGifts: [],
    themes: [], patterns: [], environments: [], season: "PRIVATE FAMILY AND AVAILABILITY NOTE",
    connection: "", prayerQuestions: [], nextStep: null, selectedStrengths: [], personalityLeanings: [],
    synthesisText: "",
  },
  bodyParts: {}, tendencies: {}, spiritualGiftMeanings: {},
  sectionEnabled: yes, subsectionEnabled: yes,
} as unknown as Parameters<typeof ProfileInfographic>[0];

test("shared area rendering shows insufficient evidence explicitly and never displays a zero", () => {
  const html = renderToStaticMarkup(createElement(IntegratedAreaResults, { results, category: "Personality" }));
  assert.match(html, /Not enough information yet/);
  assert.match(html, /Reflective/);
  assert.doesNotMatch(html, /0\.00 \/ 5|50%/);
});

test("integrated count and serving-pattern comparison render with spaces and a real name", () => {
  const countHtml = renderToStaticMarkup(createElement(IntegratedAreaResults, { results, category: "APEST" }));
  assert.match(countHtml, /1 distinct answered item/);
  assert.doesNotMatch(countHtml, /1distinct|answereditem/);

  const tendencies = Object.fromEntries([
    ["Hands", "The Doer"],
    ["Ears", "The Listener"],
  ].map(([key, name]) => [key, {
    name, description: "", explanation: "", strengths: [], blindSpots: [], icon: Hand,
  }]));
  const props = { tendency: { key: "Hands", secondaryKey: "Ears" }, tendencies, perspective: "participant" as const };
  const text = renderToStaticMarkup(createElement(ServingPatternCard, props)).replace(/<[^>]*>/g, "");
  assert.match(text, /Your Serving Pattern/);
  assert.match(text, /Your scores were close to The Listener, suggesting you may draw on both approaches/);
  assert.doesNotMatch(text, /How You Tend to Minister/);

  const missingName = renderToStaticMarkup(createElement(ServingPatternCard, {
    ...props, tendency: { key: "Hands", secondaryKey: "Unknown" },
  }));
  assert.doesNotMatch(missingName, /were close to/);
});

test("actual print tree retains all four named areas and every eligible gift, without private answers", () => {
  const html = renderToStaticMarkup(createElement(ProfileInfographic, props));
  for (const title of ["HOW YOU TEND TO MINISTER", "HOW GOD HAS EQUIPPED YOU", "WHAT YOU ARE NATURALLY GOOD AT", "HOW YOU TEND TO OPERATE"]) assert.ok(html.includes(title), title);
  for (const name of giftNames) assert.ok(html.includes(name), name);
  assert.match(html, /Not enough information yet/);
  assert.match(html, /For conversation and discernment only/);
  assert.match(html, /Discernment of Spirits/);
  assert.match(html, /Monthly/);
  assert.doesNotMatch(html, /PRIVATE/);
});

test("actual print tree excludes disabled areas including health, connection, optional gifts and notes", () => {
  const sectionEnabled = (section: string) => !["spiritualGifts", "personalityStrengths", "spiritualHealth", "connectionAvailability"].includes(section);
  const html = renderToStaticMarkup(createElement(ProfileInfographic, { ...props, sectionEnabled }));
  assert.doesNotMatch(html, /HOW GOD HAS EQUIPPED YOU|HOW YOU TEND TO OPERATE|SPIRITUAL HEALTH|CONNECTION &amp; SEASON|YOUR SERVING PATTERN|Healing|Discernment of Spirits|PRIVATE/);
  assert.match(html, /HOW YOU TEND TO MINISTER/);
});

test("unrecognized versions visibly fail closed rather than claiming insufficient legacy answers", () => {
  const unsupported = integratedResults({ ...profile, integratedAssessment: { ...profile.integratedAssessment, version: "future" } }, yes, yes)!;
  const html = renderToStaticMarkup(createElement(IntegratedAreaResults, { results: unsupported, category: "APEST" }));
  assert.match(html, /version is not supported/);
  assert.doesNotMatch(html, /4\.00/);
});