export const ASSESSMENT_SECTION_KEYS = [
  "aboutYou",
  "apest",
  "spiritualGifts",
  "passionsInterests",
  "naturalStrengths",
  "personalityStrengths",
  "spiritualHealth",
  "connectionAvailability",
] as const;

export const DEFAULT_PASSIONS = [
  "Children",
  "Youth",
  "Young adults",
  "Families",
  "New Christians",
  "People who don't know Jesus",
  "Immigrants/refugees",
  "Multicultural ministry",
  "Missions",
  "People experiencing poverty",
  "Addiction recovery",
  "Grief",
  "Elderly adults",
  "Prayer",
  "Discipleship",
  "Worship",
  "Community outreach",
  "Justice/compassion",
  "Second-generation ministry",
] as const;

export const DEFAULT_MINISTRY_INTERESTS = [
  "Children",
  "Preschool",
  "Youth",
  "Young adults",
  "Worship",
  "Sound/tech",
  "Hospitality",
  "Greeting",
  "Prayer",
  "Small groups",
  "Discipleship",
  "Outreach",
  "Missions",
  "Communications",
  "Office/admin",
  "Finance",
  "Event planning",
  "Translation",
  "Transportation",
  "Maintenance",
  "Care ministry",
  "Leadership",
] as const;

export const ASSESSMENT_SUBSECTION_KEYS = [
  "aboutYou.personalInformation",
  "aboutYou.skillsExperience",
  "aboutYou.lifeExperiences",
  "apest.builder",
  "apest.insight",
  "apest.connector",
  "apest.caregiver",
  "apest.teacher",
  "passionsInterests.passions",
  "passionsInterests.ministryInterests",
  "naturalStrengths.relationalConnection",
  "naturalStrengths.encouragement",
  "naturalStrengths.teachingExplaining",
  "naturalStrengths.listening",
  "naturalStrengths.leadershipInitiative",
  "naturalStrengths.organizing",
  "naturalStrengths.creativeExpression",
  "naturalStrengths.problemSolving",
  "naturalStrengths.practicalHandsOn",
  "naturalStrengths.hospitality",
  "naturalStrengths.compassionCare",
  "naturalStrengths.communicationStorytelling",
  "naturalStrengths.discernment",
  "naturalStrengths.followThrough",
  "naturalStrengths.adaptability",
  "naturalStrengths.mentoringDevelopment",
  "naturalStrengths.strategicThinking",
  "naturalStrengths.advocacyJustice",
  "personalityStrengths.socialEnergy",
  "personalityStrengths.decisionLens",
  "personalityStrengths.planningStyle",
  "personalityStrengths.focusStyle",
  "personalityStrengths.actionStyle",
  "personalityStrengths.pacePreference",
  "personalityStrengths.workStyle",
  "spiritualHealth.prayer",
  "spiritualHealth.scripture",
  "spiritualHealth.worship",
  "spiritualHealth.relationships",
  "spiritualHealth.community",
  "spiritualHealth.rest",
  "spiritualHealth.motivation",
  "spiritualHealth.wellbeing",
  "spiritualHealth.connection",
  "personalityStrengths.ministryPreferences",
  "connectionAvailability.churchConnection",
  "connectionAvailability.availability",
] as const;

type SectionKey = (typeof ASSESSMENT_SECTION_KEYS)[number];
type SubsectionKey = (typeof ASSESSMENT_SUBSECTION_KEYS)[number];

/**
 * Response keys include a question index (for example `builder-0`), while
 * configuration keys identify the category (`apest.builder`).  Keep this
 * mapping server-owned: using the entire client key here would make a disabled
 * category look enabled.
 */
const RESPONSE_SUBSECTION_PREFIXES = {
  apest: ["builder", "insight", "connector", "caregiver", "teacher"],
  naturalStrengths: [
    "relationalConnection",
    "encouragement",
    "teachingExplaining",
    "listening",
    "leadershipInitiative",
    "organizing",
    "creativeExpression",
    "problemSolving",
    "practicalHandsOn",
    "hospitality",
    "compassionCare",
    "communicationStorytelling",
    "discernment",
    "followThrough",
    "adaptability",
    "mentoringDevelopment",
    "strategicThinking",
    "advocacyJustice",
  ],
  personalityStrengths: [
    "socialEnergy",
    "decisionLens",
    "planningStyle",
    "focusStyle",
    "actionStyle",
    "pacePreference",
    "workStyle",
  ],
} as const;

export type AssessmentConfiguration = {
  sections: Record<SectionKey, boolean>;
  subsections: Record<SubsectionKey, boolean>;
  passions: string[];
  ministryInterests: string[];
};

function enabled<T extends readonly string[]>(keys: T): Record<T[number], boolean> {
  return Object.fromEntries(keys.map((key) => [key, true])) as Record<T[number], boolean>;
}

export function defaultAssessmentConfiguration(): AssessmentConfiguration {
  return {
    sections: enabled(ASSESSMENT_SECTION_KEYS),
    subsections: enabled(ASSESSMENT_SUBSECTION_KEYS),
    passions: [...DEFAULT_PASSIONS],
    ministryInterests: [...DEFAULT_MINISTRY_INTERESTS],
  };
}

export function assessmentConfiguration(
  value: unknown,
): AssessmentConfiguration | null {
  if (value == null) return defaultAssessmentConfiguration();
  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    sections?: Record<string, unknown>;
    subsections?: Record<string, unknown>;
    passions?: unknown;
    ministryInterests?: unknown;
  };
  if (!candidate.sections || !candidate.subsections) return null;
  if (
    Object.keys(candidate.sections).some(
      (key) => !ASSESSMENT_SECTION_KEYS.includes(key as SectionKey),
    ) ||
    Object.keys(candidate.subsections).some(
      (key) => !ASSESSMENT_SUBSECTION_KEYS.includes(key as SubsectionKey),
    )
  ) {
    return null;
  }

  const configuration = defaultAssessmentConfiguration();
  for (const key of ASSESSMENT_SECTION_KEYS) {
    if (typeof candidate.sections[key] !== "boolean") return null;
    configuration.sections[key] = candidate.sections[key];
  }
  for (const key of ASSESSMENT_SUBSECTION_KEYS) {
    if (typeof candidate.subsections[key] !== "boolean") return null;
    const parent = key.split(".")[0] as SectionKey;
    if (candidate.subsections[key] && !configuration.sections[parent]) return null;
    configuration.subsections[key] = candidate.subsections[key];
  }
  for (const [key, defaults] of [
    ["passions", DEFAULT_PASSIONS],
    ["ministryInterests", DEFAULT_MINISTRY_INTERESTS],
  ] as const) {
    const options = candidate[key];
    if (options !== undefined) {
      if (
        !Array.isArray(options) ||
        options.length > 100 ||
        options.some(
          (option) =>
            typeof option !== "string" ||
            option.trim().length < 1 ||
            option.trim().length > 80,
        ) ||
        new Set(options.map((option) => option.trim().toLocaleLowerCase())).size !==
          options.length
      ) {
        return null;
      }
    }
    configuration[key] = Array.from(
      new Map(
        [...defaults, ...(Array.isArray(options) ? options : [])].map((option) => [
          option.trim().toLocaleLowerCase(),
          option.trim(),
        ]),
      ).values(),
    );
  }
  return configuration;
}

export function filterAssessmentSection(
  section: SectionKey,
  value: unknown,
  configuration: AssessmentConfiguration,
): unknown {
  if (!configuration.sections[section]) return null;
  if (!value || typeof value !== "object") return value ?? null;

  const record = value as Record<string, unknown>;
  const disabledSubsection = ASSESSMENT_SUBSECTION_KEYS.some(
    (key) =>
      key.startsWith(`${section}.`) && !configuration.subsections[key],
  );

  if (section === "spiritualHealth") {
    // Spiritual-health keys are themselves the configured prompt keys.
    return Object.fromEntries(
      Object.entries(record).filter(
        ([key]) =>
          ASSESSMENT_SUBSECTION_KEYS.includes(
            `${section}.${key}` as SubsectionKey,
          ) && configuration.subsections[`${section}.${key}` as SubsectionKey],
      ),
    );
  }

  const prefixes = RESPONSE_SUBSECTION_PREFIXES[
    section as keyof typeof RESPONSE_SUBSECTION_PREFIXES
  ];
  if (!prefixes) {
    return record;
  }

  const source = record.responses;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    // Do not retain client-supplied result labels/prose when any category is
    // disabled and there is no trustworthy response map to derive from.
    return disabledSubsection ? {} : record;
  }
  const responses = Object.fromEntries(
    Object.entries(source as Record<string, unknown>).filter(([responseKey]) => {
      const match = /^(.+)-\d+$/.exec(responseKey);
      const category = match?.[1];
      return (
        !!category &&
        prefixes.includes(category as never) &&
        configuration.subsections[`${section}.${category}` as SubsectionKey]
      );
    }),
  );

  if (!disabledSubsection) return { ...record, responses };

  // `primary`, `selected`, dimensions, summaries, and ministry-connection
  // prose are all client-derived. They may name a disabled category, so retain
  // only source answers. Consumers can derive display values from these safe
  // responses; no client claim is stored or returned.
  return { responses };
}

export function hasEnabledSubsections(
  section: SectionKey,
  configuration: AssessmentConfiguration,
): boolean {
  return ASSESSMENT_SUBSECTION_KEYS.some(
    (key) => key.startsWith(`${section}.`) && configuration.subsections[key],
  );
}