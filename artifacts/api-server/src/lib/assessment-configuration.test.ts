import assert from "node:assert/strict";
import test from "node:test";
import {
  assessmentConfiguration,
  defaultAssessmentConfiguration,
  DEFAULT_MINISTRY_INTERESTS,
  DEFAULT_PASSIONS,
  filterAssessmentSection,
  ministrySubmissionError,
  youthProfilesConfiguration,
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

test("church-specific options extend protected generic defaults", () => {
  const defaults = defaultAssessmentConfiguration();
  const configuration = assessmentConfiguration({
    ...defaults,
    passions: ["Local school families"],
    ministryInterests: ["Community garden team"],
  });

  assert.ok(configuration);
  assert.deepEqual(configuration.passions, [
    ...DEFAULT_PASSIONS,
    "Local school families",
  ]);
  assert.deepEqual(configuration.ministryInterests, [
    ...DEFAULT_MINISTRY_INTERESTS,
    "Community garden team",
  ]);
});

test("spiritual gift question depth defaults legacy configurations to three", () => {
  const defaults = defaultAssessmentConfiguration();
  assert.equal(defaults.spiritualGiftQuestionCount, 3);

  const { spiritualGiftQuestionCount: _omitted, ...legacy } = defaults;
  const configuration = assessmentConfiguration(legacy);
  assert.equal(configuration?.spiritualGiftQuestionCount, 3);
});

test("legacy About You configurations keep every optional field enabled", () => {
  const defaults = defaultAssessmentConfiguration();
  const legacySubsections = { ...defaults.subsections } as Record<string, boolean>;
  for (const key of [
    "aboutYou.phone",
    "aboutYou.preferredContact",
    "aboutYou.familySituation",
    "aboutYou.transportation",
    "aboutYou.languages",
    "aboutYou.profilePhoto",
  ]) {
    delete legacySubsections[key];
  }

  const configuration = assessmentConfiguration({
    ...defaults,
    subsections: legacySubsections,
  });

  assert.ok(configuration);
  assert.equal(configuration.subsections["aboutYou.phone"], true);
  assert.equal(configuration.subsections["aboutYou.preferredContact"], true);
  assert.equal(configuration.subsections["aboutYou.familySituation"], true);
  assert.equal(configuration.subsections["aboutYou.transportation"], true);
  assert.equal(configuration.subsections["aboutYou.languages"], true);
  assert.equal(configuration.subsections["aboutYou.profilePhoto"], true);
});

test("spiritual gift question depth accepts one through four only", () => {
  for (const spiritualGiftQuestionCount of [1, 2, 3, 4]) {
    const configuration = assessmentConfiguration({
      ...defaultAssessmentConfiguration(),
      spiritualGiftQuestionCount,
    });
    assert.equal(
      configuration?.spiritualGiftQuestionCount,
      spiritualGiftQuestionCount,
    );
  }

  for (const spiritualGiftQuestionCount of [0, 2.5, 5]) {
    assert.equal(
      assessmentConfiguration({
        ...defaultAssessmentConfiguration(),
        spiritualGiftQuestionCount,
      }),
      null,
    );
  }
});

test("How You Minister question depth defaults legacy configurations to three", () => {
  const defaults = defaultAssessmentConfiguration();
  assert.equal(defaults.ministryQuestionCount, 3);

  const { ministryQuestionCount: _omitted, ...legacy } = defaults;
  const configuration = assessmentConfiguration(legacy);
  assert.equal(configuration?.ministryQuestionCount, 3);
});

test("How You Minister question depth accepts one through four only", () => {
  for (const ministryQuestionCount of [1, 2, 3, 4]) {
    const configuration = assessmentConfiguration({
      ...defaultAssessmentConfiguration(),
      ministryQuestionCount,
    });
    assert.equal(configuration?.ministryQuestionCount, ministryQuestionCount);
  }

  for (const ministryQuestionCount of [0, 2.5, 5]) {
    assert.equal(
      assessmentConfiguration({
        ...defaultAssessmentConfiguration(),
        ministryQuestionCount,
      }),
      null,
    );
  }
});

test("How You Minister submissions require the configured count per enabled category", () => {
  for (const ministryQuestionCount of [1, 2, 3, 4]) {
    const configuration = {
      ...defaultAssessmentConfiguration(),
      ministryQuestionCount,
    };
    const responses = Object.fromEntries(
      ["builder", "insight", "connector", "caregiver", "teacher"].flatMap(
        (key) =>
          Array.from({ length: ministryQuestionCount }, (_, index) => [
            `${key}-${index}`,
            4,
          ]),
      ),
    );
    assert.equal(
      ministrySubmissionError({ responses }, configuration),
      null,
    );
  }
});

test("How You Minister submissions reject missing or extra configured responses", () => {
  const configuration = {
    ...defaultAssessmentConfiguration(),
    ministryQuestionCount: 4,
  };
  const threeResponses = Object.fromEntries(
    ["builder", "insight", "connector", "caregiver", "teacher"].flatMap(
      (key) =>
        Array.from({ length: 3 }, (_, index) => [`${key}-${index}`, 4]),
    ),
  );
  assert.match(
    ministrySubmissionError({ responses: threeResponses }, configuration) ?? "",
    /requires 4 valid responses/,
  );
});

test("youth profiles normalize legacy churches and only permit canonical wording overrides", () => {
  const defaults = defaultAssessmentConfiguration();
  assert.equal(defaults.youthProfiles.version, 1);
  assert.equal(defaults.youthProfiles.explore.sections.guardianObservations.enabled, true);
  assert.equal(defaults.youthProfiles.explore.sections.aboutMe.enabled, true);

  const configured = youthProfilesConfiguration({
    ...defaults.youthProfiles,
    explore: {
      ...defaults.youthProfiles.explore,
      profileTitle: "My Explore Profile",
      choiceLabels: { "aboutMe.building": "Making projects" },
    },
  });
  assert.equal(configured?.explore.profileTitle, "My Explore Profile");
  assert.equal(configured?.explore.choiceLabels["aboutMe.building"], "Making projects");
  assert.equal(
    youthProfilesConfiguration({
      ...defaults.youthProfiles,
      explore: {
        ...defaults.youthProfiles.explore,
        choiceLabels: { "aboutMe.invented": "Not allowed" },
      },
    }),
    null,
  );
  assert.equal(
    youthProfilesConfiguration({
      ...defaults.youthProfiles,
      discover: {
        ...defaults.youthProfiles.discover,
        sections: {
          ...defaults.youthProfiles.discover.sections,
          aboutMe: { ...defaults.youthProfiles.discover.sections.aboutMe, enabled: false },
        },
      },
    }),
    null,
  );
});