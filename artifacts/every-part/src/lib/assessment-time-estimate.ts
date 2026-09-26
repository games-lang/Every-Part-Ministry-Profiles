import type { AssessmentConfiguration } from "@workspace/api-client-react";
import { integratedQuestionCount } from "./integrated-question-count";

const ESTIMATE_SECONDS_PER_REFLECTION = 10;

export function estimateAssessmentTime(
  configuration: AssessmentConfiguration,
  enabledSpiritualGifts: string[],
  mode: "classic" | "integrated" = "classic",
  actualIntegratedQuestionCount?: number,
) {
  const { sections, subsections, spiritualGiftQuestionCount, ministryQuestionCount } =
    configuration;
  const subsectionEnabled = (key: keyof AssessmentConfiguration["subsections"]) =>
    subsections[key];
  let seconds = 60; // Required identity details.
  let reflectionQuestions = 0;

  if (sections.aboutYou) {
    if (subsectionEnabled("aboutYou.phone")) seconds += 15;
    if (subsectionEnabled("aboutYou.preferredContact")) seconds += 10;
    if (subsectionEnabled("aboutYou.familySituation")) seconds += 10;
    if (subsectionEnabled("aboutYou.transportation")) seconds += 10;
    if (subsectionEnabled("aboutYou.languages")) seconds += 30;
    if (subsectionEnabled("aboutYou.profilePhoto")) seconds += 30;
    if (subsectionEnabled("aboutYou.skillsExperience")) seconds += 150;
    if (subsectionEnabled("aboutYou.lifeExperiences")) seconds += 90;
  }

  if (mode === "classic" && sections.apest) {
    const enabledApproaches = [
      "apest.builder",
      "apest.insight",
      "apest.connector",
      "apest.caregiver",
      "apest.teacher",
    ] as const;
    const count = enabledApproaches.filter((key) => subsectionEnabled(key)).length;
    reflectionQuestions += count * ministryQuestionCount;
  }

  if (mode === "classic" && sections.spiritualGifts) {
    reflectionQuestions += enabledSpiritualGifts.length * spiritualGiftQuestionCount;
  }

  if (sections.passionsInterests) {
    if (subsectionEnabled("passionsInterests.passions")) seconds += 60;
    if (subsectionEnabled("passionsInterests.ministryInterests")) seconds += 60;
  }

  if (mode === "classic" && sections.naturalStrengths) {
    const strengthKeys = [
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
    ] as const;
    reflectionQuestions += strengthKeys.filter((key) => subsectionEnabled(key)).length * 3;
  }

  if (sections.personalityStrengths) {
    const personalityKeys = [
      "personalityStrengths.socialEnergy",
      "personalityStrengths.decisionLens",
      "personalityStrengths.planningStyle",
      "personalityStrengths.focusStyle",
      "personalityStrengths.actionStyle",
      "personalityStrengths.pacePreference",
      "personalityStrengths.workStyle",
    ] as const;
    if (mode === "classic") reflectionQuestions += personalityKeys.filter((key) => subsectionEnabled(key)).length * 3;
    if (subsectionEnabled("personalityStrengths.ministryPreferences")) seconds += 90;
  }

  if (sections.spiritualHealth) {
    const spiritualHealthKeys = [
      "spiritualHealth.prayer",
      "spiritualHealth.scripture",
      "spiritualHealth.worship",
      "spiritualHealth.relationships",
      "spiritualHealth.community",
      "spiritualHealth.rest",
      "spiritualHealth.motivation",
      "spiritualHealth.wellbeing",
      "spiritualHealth.connection",
    ] as const;
    seconds += spiritualHealthKeys.filter((key) => subsectionEnabled(key)).length * 45;
  }

  if (sections.connectionAvailability) {
    if (subsectionEnabled("connectionAvailability.churchConnection")) seconds += 120;
    if (subsectionEnabled("connectionAvailability.availability")) seconds += 150;
  }

  if (mode === "integrated") {
    reflectionQuestions = actualIntegratedQuestionCount ??
      integratedQuestionCount(configuration, enabledSpiritualGifts);
  }
  seconds += reflectionQuestions * ESTIMATE_SECONDS_PER_REFLECTION;
  const typicalMinutes = seconds / 60;
  return {
    minimum: Math.max(1, Math.round(typicalMinutes * 0.8)),
    maximum: Math.max(1, Math.ceil(typicalMinutes * 1.2)),
    reflectionQuestions,
  };
}