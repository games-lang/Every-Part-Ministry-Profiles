import type { MinistryProfile } from "@workspace/api-client-react";
import { derivedPersonality, numericResponses, rankedApproaches, MINISTRY_APPROACHES, MINISTRY_TAGS, STRENGTH_APPROACHES } from "../pages/profile-detail";

type SectionEnabled = (section: string) => boolean;
type SubsectionEnabled = (section: string, subsection: string) => boolean;

const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

export function getMyMinistrySynthesis(
  profile: MinistryProfile,
  sectionEnabled: SectionEnabled,
  subsectionEnabled: SubsectionEnabled,
) {
  // 1. APEST
  const apestData = sectionEnabled("apest") ? asRecord(profile.assessmentSections.apest) : {};
  let apestPrimary = typeof apestData.primary === "string" ? apestData.primary : "";
  let apestSecondary = typeof apestData.secondary === "string" ? apestData.secondary : "";
  
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

  const getApestLabel = (val: string) => legacyLabels[val] || MINISTRY_TAGS[val] || val;

  const apestResult = apestPrimary ? {
    label: getApestLabel(apestPrimary),
    secondary: apestSecondary ? getApestLabel(apestSecondary) : undefined
  } : null;

  // 2. TENDENCY
  const personalityData = sectionEnabled("personalityStrengths")
    ? asRecord(profile.assessmentSections.personalityStrengths)
    : {};
  const dimensions = derivedPersonality(
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

  const scores = {
    Hands: 0, Ears: 0, Shoulders: 0, Voice: 0, Arms: 0, Backbone: 0
  };

  if (selectedStrengths.includes("Practical hands-on work")) scores.Hands += 2;
  if (selectedStrengths.includes("Problem-solving")) scores.Hands += 1;
  if (selectedStrengths.includes("Listening")) scores.Ears += 2;
  if (selectedStrengths.includes("Discernment")) scores.Ears += 1;
  if (selectedStrengths.includes("Encouragement")) scores.Shoulders += 2;
  if (selectedStrengths.includes("Mentoring and development")) scores.Shoulders += 1;
  if (selectedStrengths.includes("Communication and storytelling")) scores.Voice += 2;
  if (selectedStrengths.includes("Teaching and explaining")) scores.Voice += 1;
  if (selectedStrengths.includes("Hospitality")) scores.Arms += 2;
  if (selectedStrengths.includes("Relational connection")) scores.Arms += 2;
  if (selectedStrengths.includes("Organizing")) scores.Backbone += 2;
  if (selectedStrengths.includes("Strategic thinking")) scores.Backbone += 1;
  if (selectedStrengths.includes("Follow-through")) scores.Backbone += 1;

  const getDim = (label: string) => dimensions.find(d => d.label === label);
  const action = getDim("Action Style");
  if (action?.dominant === "left") scores.Shoulders += 1; 
  if (action?.dominant === "right") scores.Hands += 1; 
  const decision = getDim("Decision Lens");
  if (decision?.dominant === "left") scores.Ears += 1; 
  const planning = getDim("Planning Style");
  if (planning?.dominant === "right") scores.Backbone += 1; 
  const focus = getDim("Focus Style");
  if (focus?.dominant === "left") scores.Backbone += 1; 
  const pace = getDim("Pace Preference");
  if (pace?.dominant === "left") scores.Shoulders += 1; 
  const social = getDim("Social Energy");
  if (social?.dominant === "right") { scores.Arms += 1; scores.Voice += 1; }

  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primaryTendencyKey = sortedScores[0]?.[1] > 0 ? sortedScores[0][0] : null;
  const secondaryTendencyKey =
    primaryTendencyKey &&
    sortedScores[1]?.[1] > 0 &&
    sortedScores[0][1] - sortedScores[1][1] <= 1
      ? sortedScores[1][0]
      : null;

  // 3. GIFTS
  const spiritualGiftsData = sectionEnabled("spiritualGifts")
    ? asRecord(profile.assessmentSections.spiritualGifts)
    : {};
  const topGifts = Array.isArray(spiritualGiftsData.topGifts)
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
  if (selectedStrengths.includes("Mentoring and development") || topGifts.includes("Teaching")) {
    themes.push({
      name: "Helping people grow",
      reason: "Your strengths and gifts point toward equipping and developing others."
    });
  }
  if (selectedStrengths.includes("Practical hands-on work") || topGifts.includes("Helps / Service")) {
    themes.push({
      name: "Practical service",
      reason: "You are energized by meeting tangible needs and working behind the scenes."
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
    const tendencyNames: Record<string, string> = { Hands: "a Helper", Ears: "a Listener", Shoulders: "a Supporter", Voice: "a Communicator", Arms: "a Welcomer", Backbone: "an Organizer" };
    synthesisText = `You have the heart of a ${apestResult.label} and often minister as ${tendencyNames[primaryTendencyKey]}. You may flourish in environments where people need ${apestResult.label === "Shepherd" ? "consistent relationships and care" : apestResult.label === "Apostle" ? "new momentum and exploration" : apestResult.label === "Teacher" ? "truth and understanding" : apestResult.label === "Evangelist" ? "invitation and good news" : "insight and clarity"}, supported by your natural ability to ${primaryTendencyKey === "Hands" ? "take practical action" : primaryTendencyKey === "Ears" ? "listen deeply" : primaryTendencyKey === "Voice" ? "communicate effectively" : primaryTendencyKey === "Arms" ? "connect with others" : primaryTendencyKey === "Backbone" ? "organize details" : "provide steady support"}.`;
  }

  // 6. ENVIRONMENTS
  const environments: { name: string; match: "Strong Alignment" | "Worth Exploring" | "Possible Stretch Area"; reason: string }[] = [];
  if (apestResult?.label === "Shepherd" || primaryTendencyKey === "Ears") {
    environments.push({ name: "Discipleship / Care", match: "Strong Alignment", reason: "Aligns with your pastoral orientation and relational strengths." });
  }
  if (apestResult?.label === "Teacher" || topGifts.includes("Teaching")) {
    environments.push({ name: "Teaching / Small Groups", match: "Strong Alignment", reason: "Aligns with your desire to make ideas clear." });
  }
  if (apestResult?.label === "Apostle" || primaryTendencyKey === "Hands") {
    environments.push({ name: "New Initiatives / Outreach", match: "Worth Exploring", reason: "Fits your builder mentality and action-oriented style." });
  }
  if (primaryTendencyKey === "Backbone" || topGifts.includes("Administration")) {
    environments.push({ name: "Operations / Logistics", match: "Strong Alignment", reason: "Utilizes your organizing and system-building strengths." });
  }
  for (const interest of profile.interests.slice(0, 2)) {
    if (!environments.some(environment => environment.name.toLowerCase() === interest.toLowerCase())) {
      environments.push({
        name: interest,
        match: "Worth Exploring",
        reason: "You named this as an area of ministry interest; a conversation could clarify what draws you toward it.",
      });
    }
  }
  if (environments.length === 1 && primaryTendencyKey) {
    const stretchByTendency: Record<string, string> = {
      Hands: "Listening / Personal Care",
      Ears: "Visible Communication",
      Shoulders: "Leading a Small Initiative",
      Voice: "Behind-the-Scenes Service",
      Arms: "Focused Independent Service",
      Backbone: "Flexible Relational Ministry",
    };
    environments.push({
      name: stretchByTendency[primaryTendencyKey],
      match: "Possible Stretch Area",
      reason: "This may use a less-natural approach and could be explored with support, clear expectations, and room to grow.",
    });
  }
  const uniqueEnvironments = environments
    .filter((environment, index, all) => all.findIndex(item => item.name === environment.name) === index)
    .slice(0, 5);

  // 7. SEASON
  const seasonParts: string[] = [];
  if (profile.servingFrequency) seasonParts.push(`a preferred serving rhythm of ${profile.servingFrequency.toLowerCase()}`);
  if (profile.availability.length) seasonParts.push(`availability on ${profile.availability.join(", ")}`);
  const familySituation = asText(profile.basicInformation.familySituation);
  const transportation = asText(profile.basicInformation.transportation);
  const availabilityDetails = asRecord(profile.availabilityDetails);
  const availabilityNotes = Object.values(availabilityDetails).map(asText).filter(Boolean).slice(0, 2);
  if (familySituation) seasonParts.push(`a family context described as ${familySituation}`);
  if (transportation) seasonParts.push(`transportation noted as ${transportation}`);
  if (availabilityNotes.length) seasonParts.push(availabilityNotes.join("; "));
  const season = seasonParts.length
    ? `Your profile reflects ${seasonParts.join(", ")}. These details are context for discernment, not measures of commitment.`
    : "";

  // 8. CONNECTION
  const conn = profile.churchConnection;
  let connection = "";
  if (conn.attendanceLength) {
    connection = `You have been attending for ${conn.attendanceLength}.`;
  }
  if (conn.connectionLevel) {
    connection += `${connection ? " " : ""}You described your current connection as ${conn.connectionLevel}.`;
  }
  if (conn.servedBefore) {
    connection += `${connection ? " " : ""}You also shared that you have served here before, which may give you helpful knowledge of the church body.`;
  }
  const languages = asRecord(profile.basicInformation.languages);
  const languageEntries = Array.isArray(languages.entries)
    ? languages.entries.filter(entry => entry && typeof entry === "object").length
    : Array.isArray(languages.spoken) ? languages.spoken.length : 0;
  if (languageEntries > 1) {
    connection += `${connection ? " " : ""}Your experience with multiple languages may help you build bridges across cultures or generations.`;
  }

  // 9. QUESTIONS
  const prayerQuestions = [
    "Where have I seen God use my natural strengths to bless others recently?",
    "Does my current season of life leave room for me to serve joyfully, or do I need to establish healthier rhythms first?",
  ];
  if (apestResult) prayerQuestions.push(`How might God use my ${apestResult.label.toLowerCase()} tendency to build up the church without making it my whole identity?`);
  if (primaryTendencyKey) prayerQuestions.push(`When has my ${primaryTendencyKey.toLowerCase()} tendency helped someone else flourish, and when has it needed balance?`);
  if (topGifts.length) prayerQuestions.push(`Where have trusted people affirmed the gift of ${topGifts[0]} in me?`);
  if (profile.passions.length) prayerQuestions.push(`Why do ${profile.passions.slice(0, 2).join(" and ")} matter deeply to me?`);
  if (profile.interests.length) prayerQuestions.push(`What could I learn by prayerfully exploring ${profile.interests[0]} with a ministry leader?`);
  prayerQuestions.push("Who knows me well enough to help me discern a faithful, sustainable next step?");

  // 10. NEXT STEP
  const nextStep = {
    title: "Have a Conversation",
    description: "Share this profile with a ministry leader or pastor to pray together about where God might be calling you to serve."
  };

  return {
    apestResult,
    ministryTendency: primaryTendencyKey ? { key: primaryTendencyKey, secondaryKey: secondaryTendencyKey } : null,
    topGifts,
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