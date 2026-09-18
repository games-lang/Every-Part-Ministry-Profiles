import type { MinistryProfile } from "@workspace/api-client-react";
import { derivedPersonality, numericResponses, rankedApproaches, MINISTRY_APPROACHES, MINISTRY_TAGS, STRENGTH_APPROACHES, PERSONALITY_DIMENSIONS } from "../pages/profile-detail";
import { integratedResults, integratedPersonality } from "./integrated-results";

type SectionEnabled = (section: string) => boolean;
type SubsectionEnabled = (section: string, subsection: string) => boolean;

const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

export const MINISTRY_TENDENCY_KEYS = ["Hands", "Ears", "Shoulders", "Voice", "Arms", "Backbone"] as const;
export type MinistryTendencyKey = typeof MINISTRY_TENDENCY_KEYS[number];

type TendencyScores = Record<MinistryTendencyKey, number>;

const zeroScores = (): TendencyScores => ({
  Hands: 0,
  Ears: 0,
  Shoulders: 0,
  Voice: 0,
  Arms: 0,
  Backbone: 0,
});

const addSignal = (
  scores: TendencyScores,
  key: MinistryTendencyKey,
  value: number,
  weight: number,
) => {
  scores[key] += Math.max(0, Math.min(1, value)) * weight;
};

const tendencyName: Record<MinistryTendencyKey, string> = {
  Hands: "Doer",
  Ears: "Listener",
  Shoulders: "Supporter",
  Voice: "Communicator",
  Arms: "Connector",
  Backbone: "Organizer",
};

export function scoreMinistryTendencies(
  dimensions: ReturnType<typeof derivedPersonality>,
  selectedStrengths: string[],
) {
  const rawScores = zeroScores();
  const availableWeight = zeroScores();
  const dimension = (label: string) => dimensions.find(item => item.label === label);
  const right = (label: string) => (dimension(label)?.rightPercentage ?? 50) / 100;
  const has = (label: string) => Boolean(dimension(label));
  const signal = (
    key: MinistryTendencyKey,
    label: string,
    direction: "left" | "right",
    weight: number,
  ) => {
    if (!has(label)) return;
    addSignal(rawScores, key, direction === "right" ? right(label) : 1 - right(label), weight);
    availableWeight[key] += weight;
  };

  // Primary evidence: the seven original "How You Tend to Operate" spectra.
  signal("Hands", "Action Style", "right", 3);
  signal("Hands", "Focus Style", "left", 2);
  signal("Hands", "Pace Preference", "right", 1);
  signal("Ears", "Social Energy", "left", 2);
  signal("Ears", "Decision Lens", "left", 3);
  signal("Ears", "Pace Preference", "left", 1);
  signal("Shoulders", "Action Style", "left", 3);
  signal("Shoulders", "Pace Preference", "left", 2);
  signal("Shoulders", "Work Style", "right", 1);
  signal("Voice", "Social Energy", "right", 3);
  signal("Voice", "Focus Style", "right", 1);
  signal("Voice", "Work Style", "right", 2);
  signal("Arms", "Social Energy", "right", 2);
  signal("Arms", "Decision Lens", "left", 2);
  signal("Arms", "Work Style", "right", 2);
  signal("Backbone", "Planning Style", "right", 3);
  signal("Backbone", "Focus Style", "left", 2);
  signal("Backbone", "Pace Preference", "left", 1);

  const normalizedScores = zeroScores();
  for (const key of MINISTRY_TENDENCY_KEYS) {
    normalizedScores[key] = availableWeight[key]
      ? rawScores[key] / availableWeight[key]
      : 0;
  }

  // Supporting evidence is intentionally capped at 10% so strengths cannot
  // overpower the personality/operation responses.
  const strengthSignals: Partial<Record<string, MinistryTendencyKey>> = {
    "Practical hands-on work": "Hands",
    "Problem-solving": "Hands",
    Listening: "Ears",
    Discernment: "Ears",
    Encouragement: "Shoulders",
    "Mentoring and development": "Shoulders",
    "Communication and storytelling": "Voice",
    "Teaching and explaining": "Voice",
    Hospitality: "Arms",
    "Relational connection": "Arms",
    Organizing: "Backbone",
    "Strategic thinking": "Backbone",
    "Follow-through": "Backbone",
  };
  const supportingSignals = zeroScores();
  for (const strength of selectedStrengths) {
    const key = strengthSignals[strength];
    if (key) supportingSignals[key] += 1;
  }
  const maxSupportingSignal = Math.max(...Object.values(supportingSignals), 1);
  const combinedScores = zeroScores();
  for (const key of MINISTRY_TENDENCY_KEYS) {
    combinedScores[key] =
      normalizedScores[key] * 0.9 +
      (supportingSignals[key] / maxSupportingSignal) * 0.1;
  }

  const ranked = MINISTRY_TENDENCY_KEYS
    .map(key => ({ key, score: combinedScores[key] }))
    .filter(result => availableWeight[result.key] > 0)
    .sort((a, b) => b.score - a.score);
  const primary = ranked[0] ?? null;
  const runnerUp = ranked[1] ?? null;
  const scoreSpread = primary && runnerUp ? primary.score - runnerUp.score : 0;
  const secondary = runnerUp && scoreSpread <= 0.08 ? runnerUp : null;
  const confidenceLevel =
    !primary || !runnerUp ? "Not enough information" :
    scoreSpread <= 0.04 ? "Blended" :
    scoreSpread <= 0.12 ? "Moderate" :
    "Clear";

  return {
    rawScores,
    normalizedScores,
    combinedScores,
    primary,
    secondary,
    confidenceLevel,
    scoreSpread,
    evidence: {
      primarySource: "How You Tend to Operate",
      supportingStrengths: selectedStrengths.filter(strength => Boolean(strengthSignals[strength])),
    },
  };
}

function combineOrientationAndTendency(
  orientation: string,
  tendency: MinistryTendencyKey,
) {
  const orientationClauses: Record<string, string> = {
    Apostle: "You may naturally move ministry toward new opportunities",
    Prophet: "You may notice concerns, truth, or spiritual realities that others miss",
    Evangelist: "You may naturally help people encounter Jesus and the Christian community",
    Shepherd: "Caring for people and helping them remain connected may be a strong orientation for you",
    Teacher: "Helping others understand truth and grow in wisdom may be a strong orientation for you",
  };
  const tendencyClauses: Record<MinistryTendencyKey, string> = {
    Hands: "taking practical action may be one of the main ways you contribute",
    Ears: "listening and making space for people may be one of the main ways you contribute",
    Shoulders: "carrying responsibility and strengthening others may be one of the main ways you contribute",
    Voice: "clear communication, encouragement, and explanation may be one of the main ways you contribute",
    Arms: "building relationships and helping people feel connected may be one of the main ways you contribute",
    Backbone: "bringing structure, planning, and follow-through may be one of the main ways you contribute",
  };
  return `${orientationClauses[orientation] ?? "You bring a meaningful ministry orientation"}, while ${tendencyClauses[tendency]}.`;
}

export function getMyMinistrySynthesis(
  profile: MinistryProfile,
  sectionEnabled: SectionEnabled,
  subsectionEnabled: SubsectionEnabled,
) {
  const integrated = integratedResults(profile, sectionEnabled, subsectionEnabled);
  // 1. APEST
  const apestData = !integrated && sectionEnabled("apest") ? asRecord(profile.assessmentSections.apest) : {};
  let apestPrimary = typeof apestData.primary === "string" ? apestData.primary : "";
  let apestSecondary = typeof apestData.secondary === "string" ? apestData.secondary : "";
  const apestSubsectionByValue: Record<string, string> = {
    Apostle: "builder",
    "Starting and building new ministry": "builder",
    Prophet: "insight",
    "Noticing what needs attention": "insight",
    Evangelist: "connector",
    "Connecting people with faith": "connector",
    Shepherd: "caregiver",
    "Caring for people over time": "caregiver",
    Teacher: "teacher",
    "Making ideas clear": "teacher",
  };
  if (!subsectionEnabled("apest", apestSubsectionByValue[apestPrimary] ?? "")) apestPrimary = "";
  if (!subsectionEnabled("apest", apestSubsectionByValue[apestSecondary] ?? "")) apestSecondary = "";
  
  if (!apestPrimary) {
    const rankings = rankedApproaches(
      numericResponses(apestData.responses),
      MINISTRY_APPROACHES,
      key => subsectionEnabled("apest", key),
    );
    apestPrimary = rankings[0]?.label || "";
    apestSecondary = rankings[1]?.label || "";
  }

  const legacyLabels: Record<string, string> = {
    "Starting and building new ministry": "Apostle",
    "Noticing what needs attention": "Prophet",
    "Connecting people with faith": "Evangelist",
    "Caring for people over time": "Shepherd",
    "Making ideas clear": "Teacher",
  };

  const supportedOrientations = new Set(["Apostle", "Prophet", "Evangelist", "Shepherd", "Teacher"]);
  const getApestLabel = (value: string) => {
    const label = legacyLabels[value] || MINISTRY_TAGS[value] || value;
    return supportedOrientations.has(label) ? label : "";
  };
  const primaryLabel = integrated ? integrated.signals("APEST")[0]?.construct ?? "" : getApestLabel(apestPrimary);
  const secondaryLabel = integrated ? integrated.signals("APEST")[1]?.construct ?? "" : getApestLabel(apestSecondary);

  const apestResult = primaryLabel ? {
    label: primaryLabel,
    secondary: secondaryLabel || undefined,
  } : null;

  // 2. TENDENCY
  const personalityData = sectionEnabled("personalityStrengths")
    ? asRecord(profile.assessmentSections.personalityStrengths)
    : {};
  const dimensions = integrated ? integratedPersonality(integrated, PERSONALITY_DIMENSIONS) : derivedPersonality(
    numericResponses(personalityData.responses),
    key => subsectionEnabled("personalityStrengths", key),
  );

  const strengthsData = sectionEnabled("naturalStrengths")
    ? asRecord(profile.assessmentSections.naturalStrengths)
    : {};
  const strengthKeyByLabel = Object.fromEntries(
    STRENGTH_APPROACHES.map(([key, label]) => [label, key]),
  ) as Record<string, string>;
  let selectedStrengths = Array.isArray(strengthsData.selected)
    ? strengthsData.selected.filter(
        (strength): strength is string =>
          typeof strength === "string" &&
          Boolean(strengthKeyByLabel[strength]) &&
          subsectionEnabled("naturalStrengths", strengthKeyByLabel[strength]),
      )
    : [];
  if (selectedStrengths.length === 0) {
    selectedStrengths = rankedApproaches(
      numericResponses(strengthsData.responses),
      STRENGTH_APPROACHES,
      key => subsectionEnabled("naturalStrengths", key),
    ).slice(0, 5).map(r => r.label);
  }
  if (integrated) selectedStrengths = integrated.signals("Strength").map(result => result.construct);

  const getDim = (label: string) => dimensions.find(d => d.label === label);
  const action = getDim("Action Style");
  const decision = getDim("Decision Lens");
  const focus = getDim("Focus Style");
  const social = getDim("Social Energy");
  const tendencyScoring = scoreMinistryTendencies(dimensions, selectedStrengths);
  const primaryTendencyKey = tendencyScoring.primary?.key ?? null;
  const secondaryTendencyKey = tendencyScoring.secondary?.key ?? null;

  // 3. GIFTS
  const spiritualGiftsData = sectionEnabled("spiritualGifts")
    ? asRecord(profile.assessmentSections.spiritualGifts)
    : {};
  const topGifts = integrated ? integrated.signals("Gift").map(result => result.construct) : Array.isArray(spiritualGiftsData.topGifts)
    ? spiritualGiftsData.topGifts.filter((gift): gift is string => typeof gift === "string").slice(0, 3)
    : [];

  // 4. THEMES & PASSIONS
  const themes: { name: string; reason: string }[] = [];
  if (sectionEnabled("passionsInterests") && subsectionEnabled("passionsInterests", "passions") && profile.passions.length > 0) {
    themes.push({
      name: "Reaching specific people",
      reason: `You expressed a passion for: ${profile.passions.join(", ")}.`
    });
  }
  if (sectionEnabled("passionsInterests") && subsectionEnabled("passionsInterests", "ministryInterests") && profile.interests.length > 0) {
    themes.push({
      name: "Serving in specific environments",
      reason: `You are drawn toward: ${profile.interests.join(", ")}.`
    });
  }
  // 5. PATTERNS
  const patterns: string[] = [];
  if (decision?.dominant === "left" || selectedStrengths.includes("Relational connection")) {
    patterns.push("People over projects");
  } else if (decision?.dominant === "right" || selectedStrengths.includes("Organizing")) {
    patterns.push("Structure and clarity");
  }
  if (action?.dominant === "right" || apestResult?.label === "Apostle") {
    patterns.push("Starting and building");
  } else if (action?.dominant === "left" || apestResult?.label === "Shepherd") {
    patterns.push("Sustaining and caring");
  }
  if (focus?.dominant === "right") {
    patterns.push("Big picture focus");
  } else if (focus?.dominant === "left") {
    patterns.push("Detail oriented");
  }
  if (social?.dominant === "left" && selectedStrengths.includes("Listening")) {
    patterns.push("Depth over quick interaction");
  } else if (social?.dominant === "right" && selectedStrengths.includes("Communication and storytelling")) {
    patterns.push("Relational communication");
  }
  if (selectedStrengths.includes("Practical hands-on work") && selectedStrengths.includes("Follow-through")) {
    patterns.push("Practical follow-through");
  }

  // Synthesis text
  let synthesisText = "";
  if (apestResult && primaryTendencyKey) {
    synthesisText = combineOrientationAndTendency(apestResult.label, primaryTendencyKey);
  } else if (primaryTendencyKey) {
    synthesisText = `You tend to minister like the ${primaryTendencyKey} of the Body. As a ${tendencyName[primaryTendencyKey]}, ${combineOrientationAndTendency("", primaryTendencyKey).split("while ")[1]}`;
  }

  // 6. SELF-NAMED MINISTRY INTERESTS
  const interestsEnabled =
    sectionEnabled("passionsInterests") &&
    subsectionEnabled("passionsInterests", "ministryInterests");
  const uniqueEnvironments = interestsEnabled
    ? [...new Set(profile.interests)].slice(0, 5).map((interest) => ({
        name: interest,
        match: "Named Interest" as const,
        reason:
          "You named this as an area of interest. Prayer and conversation can help clarify what draws you toward it.",
      }))
    : [];

  // 7. SEASON
  const seasonParts: string[] = [];
  const availabilityEnabled =
    sectionEnabled("connectionAvailability") &&
    subsectionEnabled("connectionAvailability", "availability");
  if (availabilityEnabled && profile.servingFrequency) {
    seasonParts.push(
      `a preferred serving rhythm of ${profile.servingFrequency.toLowerCase()}`,
    );
  }
  if (availabilityEnabled && profile.availability.length) {
    seasonParts.push(`availability on ${profile.availability.join(", ")}`);
  }
  const aboutYouEnabled = sectionEnabled("aboutYou");
  const familySituation = aboutYouEnabled && subsectionEnabled("aboutYou", "familySituation")
    ? asText(profile.basicInformation.familySituation)
    : "";
  const transportation = aboutYouEnabled && subsectionEnabled("aboutYou", "transportation")
    ? asText(profile.basicInformation.transportation)
    : "";
  const availabilityDetails = availabilityEnabled
    ? asRecord(profile.availabilityDetails)
    : {};
  const availabilityNotes = Object.values(availabilityDetails).map(asText).filter(Boolean).slice(0, 2);
  if (familySituation) seasonParts.push(`a family context described as ${familySituation}`);
  if (transportation) seasonParts.push(`transportation noted as ${transportation}`);
  if (availabilityNotes.length) seasonParts.push(availabilityNotes.join("; "));
  const season = seasonParts.length
    ? `Your profile reflects ${seasonParts.join(", ")}. These details are context for discernment, not measures of commitment.`
    : "";

  // 8. CONNECTION
  const churchConnectionEnabled =
    sectionEnabled("connectionAvailability") &&
    subsectionEnabled("connectionAvailability", "churchConnection");
  let connection = "";
  if (churchConnectionEnabled) {
    const conn = profile.churchConnection;
    if (conn.attendanceLength) {
      connection = `You have been attending for ${conn.attendanceLength}.`;
    }
    if (conn.connectionLevel) {
      connection += `${connection ? " " : ""}You described your current connection as ${conn.connectionLevel}.`;
    }
    if (conn.servedBefore) {
      connection += `${connection ? " " : ""}You also shared that you have served here before, which may give you helpful knowledge of the church body.`;
    }
  }
  // 9. QUESTIONS
  const prayerQuestions: string[] = [];
  if (selectedStrengths.length) {
    prayerQuestions.push(
      "Where have I seen God use my natural strengths to bless others recently?",
    );
  }
  if (season) {
    prayerQuestions.push(
      "Does my current season of life leave room for me to serve joyfully, or do I need to establish healthier rhythms first?",
    );
  }
  if (apestResult) prayerQuestions.push(`How might God use my ${apestResult.label.toLowerCase()} tendency to build up the church without making it my whole identity?`);
  if (primaryTendencyKey) prayerQuestions.push(`When has my ${primaryTendencyKey.toLowerCase()} tendency helped someone else flourish, and when has it needed balance?`);
  if (topGifts.length) prayerQuestions.push(`Where have trusted people affirmed the gift of ${topGifts[0]} in me?`);
  if (
    sectionEnabled("passionsInterests") &&
    subsectionEnabled("passionsInterests", "passions") &&
    profile.passions.length
  ) {
    prayerQuestions.push(
      `Why do ${profile.passions.slice(0, 2).join(" and ")} matter deeply to me?`,
    );
  }
  if (interestsEnabled && profile.interests.length) {
    prayerQuestions.push(
      `What could I learn by prayerfully exploring ${profile.interests[0]} with a ministry leader?`,
    );
  }
  prayerQuestions.push("Who knows me well enough to help me discern a faithful, sustainable next step?");

  // 10. NEXT STEP
  const nextStep = {
    title: "Have a Conversation",
    description: "Share this profile with a ministry leader or pastor to pray together about where God might be calling you to serve."
  };

  return {
    integrated,
    apestResult,
    ministryTendency: primaryTendencyKey ? {
      key: primaryTendencyKey,
      secondaryKey: secondaryTendencyKey,
      scoring: tendencyScoring,
    } : null,
    topGifts,
    selectedStrengths,
    personalityLeanings: dimensions.map(d => ({
      label: d.label,
      leaning: d.dominant === "left" ? d.left : d.dominant === "right" ? d.right : "Balanced",
      tendency: d.tendency,
    })),
    themes: themes.filter((theme, index, all) => all.findIndex(item => item.name === theme.name) === index).slice(0, 3),
    patterns: [...new Set(patterns)].slice(0, 5),
    environments: uniqueEnvironments,
    season,
    connection,
    prayerQuestions: prayerQuestions.slice(0, 7),
    nextStep,
    synthesisText
  };
}