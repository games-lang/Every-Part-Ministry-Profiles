import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultAssessmentConfiguration,
  filterAssessmentSection,
} from "./assessment-configuration.ts";

test("crafted assessment payloads cannot retain disabled subsection content", () => {
  const configuration = defaultAssessmentConfiguration();
  configuration.subsections["apest.insight"] = false;
  configuration.subsections["naturalStrengths.encouragement"] = false;
  configuration.subsections["personalityStrengths.socialEnergy"] = false;
  configuration.subsections["spiritualHealth.prayer"] = false;

  assert.deepEqual(
    filterAssessmentSection(
      "apest",
      {
        primary: "Insight",
        secondary: "Builder",
        injected: "untrusted",
        responses: {
          "insight-0": 5,
          "builder-0": 4,
          "unknown-0": 5,
          malformed: 5,
        },
      },
      configuration,
    ),
    { responses: { "builder-0": 4 } },
  );

  assert.deepEqual(
    filterAssessmentSection(
      "naturalStrengths",
      {
        selected: ["Encouragement", "Listening"],
        notes: "untrusted derived content",
        responses: {
          "encouragement-0": 5,
          "listening-0": 4,
        },
      },
      configuration,
    ),
    { responses: { "listening-0": 4 } },
  );

  assert.deepEqual(
    filterAssessmentSection(
      "personalityStrengths",
      {
        dimensions: [{ key: "socialEnergy", tendency: "Outgoing" }],
        summary: "Untrusted summary naming a disabled dimension.",
        ministryConnection: "Untrusted ministry guidance.",
        responses: {
          "socialEnergy-0": 5,
          "decisionLens-0": 3,
        },
      },
      configuration,
    ),
    { responses: { "decisionLens-0": 3 } },
  );

  assert.deepEqual(
    filterAssessmentSection(
      "spiritualHealth",
      {
        prayer: "Feeling strong",
        scripture: "Growing",
        injected: "untrusted",
      },
      configuration,
    ),
    { scripture: "Growing" },
  );
});

test("all-enabled assessment payloads retain safe derived values", () => {
  const configuration = defaultAssessmentConfiguration();
  const value = {
    primary: "Builder",
    secondary: "Teacher",
    responses: {
      "builder-0": 5,
      "teacher-0": 4,
      "unknown-0": 5,
    },
  };

  assert.deepEqual(filterAssessmentSection("apest", value, configuration), {
    primary: "Builder",
    secondary: "Teacher",
    responses: {
      "builder-0": 5,
      "teacher-0": 4,
    },
  });
});