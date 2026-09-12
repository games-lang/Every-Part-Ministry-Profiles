import type { MinistryProfile } from "@workspace/api-client-react";
import { getMyMinistrySynthesis } from "./my-profile-derivation";

type SignalCategory =
  | "Ability"
  | "Interest"
  | "Calling signals"
  | "Availability"
  | "Experience";

type FitSignal = {
  category: SignalCategory;
  detail: string;
  present: boolean;
};

type FitSuggestion = {
  title: string;
  rationale: string;
  signals: FitSignal[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

const fitFamilies = [
  {
    words: ["care", "pastor", "shepherd", "disciple", "mentor", "counsel", "prayer"],
    strengths: ["Listening", "Mentoring and development", "Relational connection"],
    gifts: ["Mercy", "Pastoring / Shepherding", "Teaching", "Intercession"],
    orientations: ["Shepherd", "Teacher"],
    tendencies: ["Ears", "Shoulders"],
  },
  {
    words: ["teach", "group", "study", "development", "training"],
    strengths: ["Teaching and explaining", "Mentoring and development", "Communication and storytelling"],
    gifts: ["Teaching", "Wisdom", "Knowledge", "Exhortation / Encouragement"],
    orientations: ["Teacher"],
    tendencies: ["Voice", "Ears"],
  },
  {
    words: ["outreach", "evangel", "mission", "community", "new"],
    strengths: ["Starting new things", "Communication and storytelling", "Relational connection"],
    gifts: ["Evangelism", "Apostleship", "Missionary / Cross-Cultural Ministry"],
    orientations: ["Apostle", "Evangelist"],
    tendencies: ["Voice", "Arms", "Hands"],
  },
  {
    words: ["welcome", "hospital", "connect", "greet"],
    strengths: ["Relational connection", "Listening", "Team building"],
    gifts: ["Hospitality", "Mercy", "Helps / Service"],
    orientations: ["Evangelist", "Shepherd"],
    tendencies: ["Arms", "Ears"],
  },
  {
    words: ["admin", "operation", "logistic", "organ", "production", "tech"],
    strengths: ["Organizing", "Follow-through", "Practical hands-on work"],
    gifts: ["Administration", "Leadership", "Helps / Service", "Craftsmanship"],
    orientations: ["Apostle"],
    tendencies: ["Backbone", "Hands", "Shoulders"],
  },
] as const;

export function getLeaderSynthesis(
  profile: MinistryProfile,
  sectionEnabled: (section: string) => boolean,
  subsectionEnabled: (section: string, subsection: string) => boolean,
) {
  const synthesis = getMyMinistrySynthesis(profile, sectionEnabled, subsectionEnabled);
  const basic = profile.basicInformation;
  const aboutEnabled = sectionEnabled("aboutYou");
  const personalEnabled =
    aboutEnabled && subsectionEnabled("aboutYou", "personalInformation");
  const skillsEnabled =
    aboutEnabled && subsectionEnabled("aboutYou", "skillsExperience");
  const passionsEnabled =
    sectionEnabled("passionsInterests") &&
    subsectionEnabled("passionsInterests", "passions");
  const interestsEnabled =
    sectionEnabled("passionsInterests") &&
    subsectionEnabled("passionsInterests", "ministryInterests");
  const availabilityEnabled =
    sectionEnabled("connectionAvailability") &&
    subsectionEnabled("connectionAvailability", "availability");
  const connectionEnabled =
    sectionEnabled("connectionAvailability") &&
    subsectionEnabled("connectionAvailability", "churchConnection");

  const connectionDetails = connectionEnabled
    ? asRecord(profile.churchConnection.details)
    : {};
  const availabilityDetails = availabilityEnabled
    ? asRecord(profile.availabilityDetails)
    : {};
  const strengthData = sectionEnabled("naturalStrengths")
    ? asRecord(profile.assessmentSections.naturalStrengths)
    : {};
  const selectedStrengths = Array.isArray(strengthData.selected)
    ? strengthData.selected.filter((value): value is string => typeof value === "string")
    : [];
  const previousExperience = skillsEnabled
    ? asText(profile.skills.previousMinistryExperience)
    : "";
  const hasExperience =
    Boolean(previousExperience) && !/none|first time|not yet/i.test(previousExperience);
  const capacity = asText(availabilityDetails.capacityThisSeason);
  const servingLoad = [
    asText(availabilityDetails.servingLoadCount),
    asText(availabilityDetails.servingLoadFeel),
  ]
    .filter(Boolean)
    .join(" — ");
  const limitedCapacity =
    availabilityEnabled &&
    /stretched|limited|little|overloaded|full|not available|pause|rest/i.test(
      `${capacity} ${servingLoad}`,
    );

  const snapshot = {
    name: profile.memberName,
    age: personalEnabled ? profile.age || null : null,
    congregation:
      connectionEnabled
        ? asText(connectionDetails.congregation) ||
          asText(connectionDetails.service) ||
          null
        : null,
    languages: personalEnabled ? basic.languages || null : null,
    completionDate: profile.completedAt,
    apestResult: synthesis.apestResult,
    ministryTendency: synthesis.ministryTendency,
    topGifts: synthesis.topGifts,
    themes: passionsEnabled ? synthesis.themes : [],
    availability: availabilityEnabled
      ? profile.availability.join(", ") || profile.servingFrequency || null
      : null,
    experience: previousExperience || null,
  };

  const ministryFit = {
    strong: [] as FitSuggestion[],
    exploring: [] as FitSuggestion[],
    stretch: [] as FitSuggestion[],
  };

  if (interestsEnabled) {
    for (const interest of profile.interests.slice(0, 6)) {
      const family = fitFamilies.find((candidate) =>
        includesAny(interest, [...candidate.words]),
      );
      const matchedStrengths = family
        ? selectedStrengths.filter((strength) =>
            family.strengths.some((candidate) =>
              strength.toLowerCase().includes(candidate.toLowerCase()),
            ),
          )
        : [];
      const matchedGifts = family
        ? synthesis.topGifts.filter((gift) => family.gifts.includes(gift as never))
        : [];
      const orientationMatch = Boolean(
        family &&
          synthesis.apestResult &&
          family.orientations.includes(synthesis.apestResult.label as never),
      );
      const tendencyMatch = Boolean(
        family &&
          synthesis.ministryTendency &&
          family.tendencies.includes(synthesis.ministryTendency.key as never),
      );
      const supportCount =
        matchedStrengths.length +
        matchedGifts.length +
        Number(orientationMatch) +
        Number(tendencyMatch) +
        Number(hasExperience);

      const signals: FitSignal[] = [
        {
          category: "Ability",
          detail: matchedStrengths.length
            ? matchedStrengths.slice(0, 2).join(", ")
            : "No closely related natural-strength signal was identified.",
          present: matchedStrengths.length > 0,
        },
        {
          category: "Interest",
          detail: `They named ${interest} as an area of interest.`,
          present: true,
        },
        {
          category: "Calling signals",
          detail:
            [
              ...matchedGifts,
              orientationMatch ? `${synthesis.apestResult?.label} orientation` : "",
              tendencyMatch
                ? `${synthesis.ministryTendency?.key} ministry tendency`
                : "",
            ]
              .filter(Boolean)
              .join(", ") || "No closely related orientation or gift signal was identified.",
          present: matchedGifts.length > 0 || orientationMatch || tendencyMatch,
        },
        {
          category: "Availability",
          detail: !availabilityEnabled
            ? "Availability was not included in this profile."
            : limitedCapacity
              ? "Current capacity appears limited; treat this as a future or lighter conversation."
              : snapshot.availability || "No limiting availability signal was identified.",
          present: availabilityEnabled && !limitedCapacity,
        },
        {
          category: "Experience",
          detail: hasExperience
            ? previousExperience
            : previousExperience || "No related prior experience was identified.",
          present: hasExperience,
        },
      ];

      const suggestion = {
        title: interest,
        signals,
        rationale: limitedCapacity
          ? "The interest may be meaningful, but current capacity suggests a future, lighter, or exploratory conversation rather than an immediate responsibility."
          : supportCount >= 3
            ? "Several independent profile signals support a prayerful conversation about this self-named interest."
            : supportCount >= 1
              ? "The interest is clear and has some supporting signals, but conversation should clarify fit and readiness."
              : "The person named this interest, while the current profile offers fewer supporting ability or experience signals. It may be useful as a development or exploration conversation.",
      };

      if (limitedCapacity || supportCount < 1) {
        ministryFit.stretch.push(suggestion);
      } else if (supportCount >= 3) {
        ministryFit.strong.push(suggestion);
      } else {
        ministryFit.exploring.push(suggestion);
      }
    }
  }

  const thingsWorthDiscussing: { title: string; reason: string }[] = [];

  if (limitedCapacity) {
    thingsWorthDiscussing.push({
      title: "Possible overcommitment",
      reason: "This may be worth discussing. Their self-reported capacity or serving load indicates they may be carrying a lot right now.",
    });
  }

  if (interestsEnabled && profile.interests.length >= 4) {
    thingsWorthDiscussing.push({
      title: "Broad interests",
      reason: "They selected many areas of interest. It may be helpful to discuss what draws them to these specific areas.",
    });
  }

  if (skillsEnabled && previousExperience && !hasExperience) {
    thingsWorthDiscussing.push({
      title: "Limited prior experience",
      reason: "They noted limited previous ministry experience, which may make this a great season for shadowing or team-based serving.",
    });
  }

  const leadershipExp = skillsEnabled
    ? asText(profile.skills.leadershipExperience)
    : "";
  if (leadershipExp.length > 5 && !/none/i.test(leadershipExp)) {
    thingsWorthDiscussing.push({
      title: "Leadership experience",
      reason: "They shared previous leadership experience. Exploring how they stewarded that responsibility may provide helpful context.",
    });
  }

  if (!synthesis.apestResult && !synthesis.ministryTendency) {
    thingsWorthDiscussing.push({
      title: "Calling uncertainty",
      reason: "Their assessment responses didn't indicate a clear single tendency or orientation. This may be an opportunity for broad exploration rather than narrowing in quickly.",
    });
  }

  const conversationQuestions = [
    "How did you feel while completing this profile, and what surprised you?",
    ...synthesis.prayerQuestions.slice(0, 4),
    ...(interestsEnabled && profile.interests.length
      ? [
          `You named ${profile.interests.slice(0, 2).join(" and ")}. What draws you toward ${profile.interests.length > 1 ? "those areas" : "that area"}?`,
        ]
      : []),
    ...(availabilityEnabled
      ? [
          "What would a healthy and sustainable rhythm of serving look like in your current season?",
        ]
      : []),
    ...(skillsEnabled && previousExperience
      ? ["What did you learn from your previous ministry experience?"]
      : []),
    "Where have other people already seen God use you to strengthen or encourage someone?",
    "Which parts of this profile feel most accurate, and which need more context?",
    "What kind of support, training, or team environment would help you serve with health and joy?",
    "Who knows you well enough to help us discern a faithful next step together?",
  ].slice(0, 8);

  return {
    participantSynthesis: synthesis,
    snapshot,
    ministryFit,
    thingsWorthDiscussing,
    conversationQuestions,
  };
}