import type { MinistryProfile } from "@workspace/api-client-react";
import { derivedPersonality, numericResponses, rankedApproaches, MINISTRY_APPROACHES, MINISTRY_TAGS, STRENGTH_APPROACHES } from "../pages/profile-detail";

export function getMyMinistrySynthesis(profile: MinistryProfile, isStrengthEnabled: (k: string) => boolean) {
  // 1. APEST
  const apestData = profile.assessmentSections.apest && typeof profile.assessmentSections.apest === "object" ? profile.assessmentSections.apest as Record<string, unknown> : {};
  let apestPrimary = typeof apestData.primary === "string" ? apestData.primary : "";
  let apestSecondary = typeof apestData.secondary === "string" ? apestData.secondary : "";
  
  if (!apestPrimary) {
    const rankings = rankedApproaches(numericResponses(apestData.responses), MINISTRY_APPROACHES, () => true);
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
  const personalityData = profile.assessmentSections.personalityStrengths && typeof profile.assessmentSections.personalityStrengths === "object" ? profile.assessmentSections.personalityStrengths as Record<string, unknown> : {};
  const dimensions = derivedPersonality(numericResponses(personalityData.responses), () => true);

  const strengthsData = profile.assessmentSections.naturalStrengths && typeof profile.assessmentSections.naturalStrengths === "object" ? profile.assessmentSections.naturalStrengths as Record<string, unknown> : {};
  let selectedStrengths = Array.isArray(strengthsData.selected) ? strengthsData.selected.filter(s => typeof s === "string") as string[] : [];
  if (selectedStrengths.length === 0) {
    selectedStrengths = rankedApproaches(numericResponses(strengthsData.responses), STRENGTH_APPROACHES, isStrengthEnabled).slice(0, 5).map(r => r.label);
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
  const primaryTendencyKey = sortedScores[0][1] > 0 ? sortedScores[0][0] : "Hands"; // default fallback

  // 3. GIFTS
  const spiritualGiftsData = profile.assessmentSections.spiritualGifts && typeof profile.assessmentSections.spiritualGifts === "object" ? profile.assessmentSections.spiritualGifts as Record<string, unknown> : {};
  const topGifts = Array.isArray(spiritualGiftsData.topGifts) ? spiritualGiftsData.topGifts.filter(g => typeof g === "string") as string[] : [];

  // 4. THEMES & PASSIONS
  const themes: { name: string; reason: string }[] = [];
  if (profile.passions && profile.passions.length > 0) {
    themes.push({
      name: "Reaching specific people",
      reason: `You expressed a passion for: ${profile.passions.join(", ")}.`
    });
  }
  if (profile.interests && profile.interests.length > 0) {
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

  // Synthesis text
  let synthesisText = "";
  if (apestResult && primaryTendencyKey) {
    const tendencyNames: Record<string, string> = { Hands: "a Helper", Ears: "a Listener", Shoulders: "a Supporter", Voice: "a Communicator", Arms: "a Welcomer", Backbone: "an Organizer" };
    synthesisText = `You have the heart of a ${apestResult.label} and often minister as ${tendencyNames[primaryTendencyKey]}. You may flourish in environments where people need ${apestResult.label === "Shepherd" ? "consistent relationships and care" : apestResult.label === "Apostle" ? "new momentum and exploration" : apestResult.label === "Teacher" ? "truth and understanding" : apestResult.label === "Evangelist" ? "invitation and good news" : "insight and clarity"}, supported by your natural ability to ${primaryTendencyKey === "Hands" ? "take practical action" : primaryTendencyKey === "Ears" ? "listen deeply" : primaryTendencyKey === "Voice" ? "communicate effectively" : primaryTendencyKey === "Arms" ? "connect with others" : primaryTendencyKey === "Backbone" ? "organize details" : "provide steady support"}.`;
  }

  // 6. ENVIRONMENTS
  const environments: { name: string; match: string; reason: string }[] = [];
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
  if (environments.length === 0) {
    environments.push({ name: "Hospitality / Welcome", match: "Worth Exploring", reason: "A great place to connect and learn where you fit best." });
  }

  // 7. SEASON
  let season = "";
  if (profile.servingFrequency || profile.availability?.length) {
    season = `You indicated you are available ${profile.servingFrequency?.toLowerCase() || "regularly"} ${profile.availability?.length ? "on " + profile.availability.join(", ") : ""}.`;
  }

  // 8. CONNECTION
  const conn = profile.churchConnection;
  let connection = "";
  if (conn.attendanceLength) {
    connection = `You have been attending for ${conn.attendanceLength}.`;
    if (conn.connectionLevel && conn.connectionLevel >= 4) {
      connection += " You feel highly connected to the church community.";
    }
  }

  // 9. QUESTIONS
  const prayerQuestions = [
    "Where have I seen God use my natural strengths to bless others recently?",
    "Does my current season of life leave room for me to serve joyfully, or do I need to establish healthier rhythms first?",
    `How might God want to use my tendency as an ${apestResult?.label} to build up the church?`
  ];
  if (topGifts.length) prayerQuestions.push(`How can I continue to develop my gift of ${topGifts[0]}?`);

  // 10. NEXT STEP
  const nextStep = {
    title: "Have a Conversation",
    description: "Share this profile with a ministry leader or pastor to pray together about where God might be calling you to serve."
  };

  return {
    apestResult,
    ministryTendency: { key: primaryTendencyKey },
    topGifts,
    themes,
    patterns,
    environments,
    season,
    connection,
    prayerQuestions,
    nextStep,
    synthesisText
  };
}