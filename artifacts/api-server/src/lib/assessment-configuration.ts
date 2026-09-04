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

export const DEFAULT_SPIRITUAL_GIFT_QUESTION_COUNT = 3;
export const DEFAULT_MINISTRY_QUESTION_COUNT = 3;
export const YOUTH_PROFILE_KEYS = ["discover", "explore", "develop"] as const;
export type YouthProfileKey = (typeof YOUTH_PROFILE_KEYS)[number];

/**
 * Youth answer identifiers are deliberately server-owned.  Churches may change
 * the language a child sees, but never the identifiers used in submissions and
 * result calculations.
 *
 * Only guardian observations are optional today.  The remaining sections feed
 * the existing strict submission/result schemas, so allowing them to disappear
 * would either require invented answers or make old results unreadable.
 */
const YOUTH_PROFILE_DEFINITIONS = {
  discover: {
    title: "Discover Profile",
    description: "For ages 6-8. This is a fun way to explore how God made you!",
    sections: {
      aboutMe: ["building", "creating", "moving", "talking", "listening", "organizing", "learning", "caring"],
      tendencies: ["love", "sometimes", "quiet", "not-yet", "jump-in", "ask-first", "prefer-support"],
      caringAndHelping: ["family", "friends", "youngerKids", "olderPeople", "lonelyPeople", "animals", "nature", "church", "neighborhood", "welcoming", "encouraging", "making", "praying", "sharing", "cleaning", "teaching", "performing"],
      growingWithJesus: ["bibleStories", "prayer", "worship", "helpingOthers", "questionsAboutGod", "quietTime"],
      opportunities: ["welcome", "kids", "students", "worship", "production", "prayer", "hospitality", "communityCare", "outreach", "creative", "behindTheScenes"],
      guardianObservations: [],
    },
  },
  explore: {
    title: "Explore Profile",
    description: "For ages 9-12. Explore how you enjoy helping and growing.",
    sections: {
      aboutMe: ["building", "creating", "moving", "talking", "listening", "organizing", "learning", "caring", "games", "outdoors"],
      howITendToOperate: ["being-with-people", "mix-of-both", "quiet-time", "talk-it-out", "think-it-through", "try-and-see", "plan-ahead", "little-plan", "go-with-the-flow", "one-thing", "switch-it-up", "notice-details", "jump-in", "help-behind-scenes", "ask-first"],
      peopleAndNeeds: ["children", "friends", "lonely", "dont-know-jesus", "newcomers", "disabilities", "older-adults", "poverty", "immigrants", "cultures", "animals", "neighborhood", "justice"],
      waysIEnjoyHelping: ["encouraging", "leading", "organizing", "teaching", "serving", "welcoming", "creating", "giving", "praying", "listening", "solving", "making", "music", "technology", "helping-younger", "inviting", "behind-scenes"],
      growingWithJesus: ["prayer", "bible", "worship", "asking-questions", "serving", "talking-about-jesus", "christian-adults"],
      opportunities: ["welcome", "prayer", "kids", "worship", "scriptureReading", "production", "communityCare", "missions", "encouragementCards", "hospitality", "setup", "creative", "events"],
      guardianObservations: [],
    },
  },
  develop: {
    title: "Develop Profile",
    description: "For ages 13-17. Notice how you may be growing, serving, and finding your purpose.",
    sections: {
      prayerAndCalling: [],
      aboutMe: ["people", "creating", "building", "learning", "organizing", "moving", "writing", "helping", "technology", "quiet"],
      howITendToOperate: ["energized-with-people", "mix-of-both", "recharge-alone", "talk-it-out", "think-it-through", "learn-by-doing", "plan-ahead", "adapt-as-you-go", "last-minute-energy", "people-first", "balance-both", "details-and-ideas", "act-then-reflect", "reflect-then-act", "move-between-both", "take-the-lead", "support-the-lead", "share-leadership", "address-it-directly", "listen-and-find-common-ground", "pause-and-seek-guidance", "close-team", "variety-of-people", "independent-with-check-ins"],
      giftsToExplore: ["encouragement", "teaching", "mercy", "leadership", "hospitality", "service", "faith", "wisdom", "creativity", "prayer", "discernment", "evangelism"],
      passions: ["friends", "newcomers", "children", "older-adults", "hurting", "community", "justice", "missions", "creation", "practical-needs"],
      growingWithJesus: ["prayer", "bible", "worship", "questions", "serving", "sharing", "mentoring", "community"],
      callingAndPurpose: [],
      ministryInterests: ["welcome", "prayer", "kids", "students", "worship", "production", "scriptureReading", "communityCare", "missions", "creative", "events", "behindTheScenes"],
      availabilityAndResponsibility: ["weekly", "monthly", "seasonal", "not-sure-yet", "ready-for-responsibility", "growing-into-it", "start-small"],
      developmentPlan: [],
      guardianObservations: [],
    },
  },
} as const;

export type YouthProfileConfiguration = {
  profileTitle: string;
  profileDescription: string;
  sections: Record<string, { enabled: boolean; title: string; description: string }>;
  choiceLabels: Record<string, string>;
};
export type YouthProfilesConfiguration = {
  version: 1;
  discover: YouthProfileConfiguration;
  explore: YouthProfileConfiguration;
  develop: YouthProfileConfiguration;
};

const label = (value: string) => value.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
export function defaultYouthProfilesConfiguration(): YouthProfilesConfiguration {
  const profiles = Object.fromEntries(YOUTH_PROFILE_KEYS.map((profile) => {
    const definition = YOUTH_PROFILE_DEFINITIONS[profile];
    return [profile, {
      profileTitle: definition.title,
      profileDescription: definition.description,
      sections: Object.fromEntries(Object.entries(definition.sections).map(([key]) => [key, {
        enabled: true,
        title: label(key),
        description: key === "guardianObservations"
          ? "Optional notes from a guardian."
          : `Reflection questions about ${label(key).toLocaleLowerCase()}.`,
      }])),
      choiceLabels: Object.fromEntries(
        Object.entries(definition.sections).flatMap(([section, choices]) =>
          Array.from(choices as readonly string[]).map((choice) => [
            `${section}.${choice}`,
            label(choice),
          ]),
        ),
      ),
    }];
  })) as Record<YouthProfileKey, YouthProfileConfiguration>;
  return {
    version: 1,
    ...profiles,
  };
}

function validYouthLabel(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}

export function youthProfilesConfiguration(value: unknown): YouthProfilesConfiguration | null {
  if (value === undefined) return defaultYouthProfilesConfiguration();
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (Object.keys(source).some((key) => key !== "version" && !YOUTH_PROFILE_KEYS.includes(key as YouthProfileKey)) || source.version !== 1) return null;
  const defaults = defaultYouthProfilesConfiguration();
  for (const profile of YOUTH_PROFILE_KEYS) {
    const candidate = source[profile];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const config = candidate as Record<string, unknown>;
    if (Object.keys(config).some((key) => !["profileTitle", "profileDescription", "sections", "choiceLabels"].includes(key))) return null;
    if (!validYouthLabel(config.profileTitle, 80) || !validYouthLabel(config.profileDescription, 300) || !config.sections || typeof config.sections !== "object" || Array.isArray(config.sections) || !config.choiceLabels || typeof config.choiceLabels !== "object" || Array.isArray(config.choiceLabels)) return null;
    const definitions = YOUTH_PROFILE_DEFINITIONS[profile].sections;
    const sections = config.sections as Record<string, unknown>;
    if (Object.keys(sections).length !== Object.keys(definitions).length || Object.keys(sections).some((key) => !(key in definitions))) return null;
    let substantiveEnabled = false;
    for (const key of Object.keys(definitions)) {
      const section = sections[key];
      if (!section || typeof section !== "object" || Array.isArray(section)) return null;
      const entry = section as Record<string, unknown>;
      if (Object.keys(entry).some((entryKey) => !["enabled", "title", "description"].includes(entryKey)) || typeof entry.enabled !== "boolean" || !validYouthLabel(entry.title, 80) || !validYouthLabel(entry.description, 300)) return null;
      // This is the sole safely optional section until answer and result
      // contracts support omission. Mandatory data collection stays locked.
      if (key !== "guardianObservations" && entry.enabled !== true) return null;
      if (key !== "guardianObservations") substantiveEnabled = true;
      defaults[profile].sections[key] = { enabled: entry.enabled, title: (entry.title as string).trim(), description: (entry.description as string).trim() };
    }
    if (!substantiveEnabled) return null;
    const choiceLabels = config.choiceLabels as Record<string, unknown>;
    const allowedChoices = new Set(
      Object.entries(definitions).flatMap(([section, choices]) =>
        Array.from(choices as readonly string[]).map((choice) => `${section}.${choice}`),
      ),
    );
    if (Object.keys(choiceLabels).some((key) => !allowedChoices.has(key) || !validYouthLabel(choiceLabels[key], 120))) return null;
    defaults[profile].profileTitle = (config.profileTitle as string).trim();
    defaults[profile].profileDescription = (config.profileDescription as string).trim();
    defaults[profile].choiceLabels = Object.fromEntries(Object.entries(choiceLabels).map(([key, value]) => [key, (value as string).trim()]));
  }
  return defaults;
}
const MINISTRY_APPROACH_KEYS = [
  "builder",
  "insight",
  "connector",
  "caregiver",
  "teacher",
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
  spiritualGiftQuestionCount: number;
  ministryQuestionCount: number;
  passions: string[];
  ministryInterests: string[];
  youthProfiles: YouthProfilesConfiguration;
};

function enabled<T extends readonly string[]>(keys: T): Record<T[number], boolean> {
  return Object.fromEntries(keys.map((key) => [key, true])) as Record<T[number], boolean>;
}

export function defaultAssessmentConfiguration(): AssessmentConfiguration {
  return {
    sections: enabled(ASSESSMENT_SECTION_KEYS),
    subsections: enabled(ASSESSMENT_SUBSECTION_KEYS),
    spiritualGiftQuestionCount: DEFAULT_SPIRITUAL_GIFT_QUESTION_COUNT,
    ministryQuestionCount: DEFAULT_MINISTRY_QUESTION_COUNT,
    passions: [...DEFAULT_PASSIONS],
    ministryInterests: [...DEFAULT_MINISTRY_INTERESTS],
    youthProfiles: defaultYouthProfilesConfiguration(),
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
    spiritualGiftQuestionCount?: unknown;
    ministryQuestionCount?: unknown;
    passions?: unknown;
    ministryInterests?: unknown;
    youthProfiles?: unknown;
  };
  if (
    Object.keys(candidate).some(
      (key) =>
        ![
          "sections",
          "subsections",
          "spiritualGiftQuestionCount",
          "ministryQuestionCount",
          "passions",
          "ministryInterests",
          "youthProfiles",
        ].includes(key),
    )
  ) return null;
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
  if (candidate.spiritualGiftQuestionCount !== undefined) {
    if (
      !Number.isInteger(candidate.spiritualGiftQuestionCount) ||
      (candidate.spiritualGiftQuestionCount as number) < 1 ||
      (candidate.spiritualGiftQuestionCount as number) > 4
    ) {
      return null;
    }
    configuration.spiritualGiftQuestionCount =
      candidate.spiritualGiftQuestionCount as number;
  }
  if (candidate.ministryQuestionCount !== undefined) {
    if (
      !Number.isInteger(candidate.ministryQuestionCount) ||
      (candidate.ministryQuestionCount as number) < 1 ||
      (candidate.ministryQuestionCount as number) > 4
    ) {
      return null;
    }
    configuration.ministryQuestionCount =
      candidate.ministryQuestionCount as number;
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
  const youthProfiles = youthProfilesConfiguration(candidate.youthProfiles);
  if (!youthProfiles) return null;
  configuration.youthProfiles = youthProfiles;
  return configuration;
}

export function ministrySubmissionError(
  value: unknown,
  configuration: AssessmentConfiguration,
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "How you minister responses are required.";
  }
  const source = (value as Record<string, unknown>).responses;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return "How you minister responses are required.";
  }
  const responses = source as Record<string, unknown>;
  const questionCount = configuration.ministryQuestionCount;

  for (const key of MINISTRY_APPROACH_KEYS) {
    if (!configuration.subsections[`apest.${key}`]) continue;
    const categoryEntries = Object.entries(responses).filter(([responseKey]) =>
      new RegExp(`^${key}-\\d+$`).test(responseKey),
    );
    const valid =
      categoryEntries.length === questionCount &&
      Array.from({ length: questionCount }, (_, index) =>
        responses[`${key}-${index}`],
      ).every(
        (response) =>
          typeof response === "number" &&
          Number.isInteger(response) &&
          response >= 1 &&
          response <= 5,
      );
    if (!valid) {
      return `Each enabled How You Minister category requires ${questionCount} valid ${questionCount === 1 ? "response" : "responses"} (${key}).`;
    }
  }
  return null;
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