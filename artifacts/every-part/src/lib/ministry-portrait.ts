import type { MinistryProfile } from "@workspace/api-client-react";
import type { getMyMinistrySynthesis } from "./my-profile-derivation";

type ParticipantSynthesis = ReturnType<typeof getMyMinistrySynthesis>;

export function buildMinistryPortrait(
  profile: MinistryProfile,
  synthesis: ParticipantSynthesis,
  sectionEnabled: (section: string) => boolean,
  subsectionEnabled: (section: string, subsection: string) => boolean,
  perspective: "participant" | "leader",
) {
  const isParticipant = perspective === "participant";
  const subject = isParticipant ? "Your" : "Their";
  const sentences: string[] = [];

  if (synthesis.apestResult || synthesis.ministryTendency) {
    const orientation = synthesis.apestResult
      ? `a ${synthesis.apestResult.label.toLowerCase()} contribution orientation`
      : "a developing contribution orientation";
    const approach = synthesis.ministryTendency
      ? ` and often approaches ministry like the ${synthesis.ministryTendency.key} of the Body`
      : "";
    sentences.push(
      `${subject} profile begins with ${orientation}${approach}. This is a starting point for discernment, not a fixed identity.`,
    );
  }

  if (synthesis.topGifts.length) {
    sentences.push(
      `${subject} reflections on ${synthesis.topGifts.slice(0, 3).join(", ")} may describe ways God has equipped ${isParticipant ? "you" : "them"} to strengthen others.`,
    );
  }

  const passionsEnabled =
    sectionEnabled("passionsInterests") &&
    subsectionEnabled("passionsInterests", "passions");
  const interestsEnabled =
    sectionEnabled("passionsInterests") &&
    subsectionEnabled("passionsInterests", "ministryInterests");
  const heartSignals = [
    ...(passionsEnabled ? profile.passions : []),
    ...(interestsEnabled ? profile.interests : []),
  ].slice(0, 4);
  if (heartSignals.length) {
    sentences.push(
      `${subject} interest in ${heartSignals.join(", ")} shows where attention and concern are already being drawn.`,
    );
  }

  const storyEnabled =
    sectionEnabled("aboutYou") &&
    subsectionEnabled("aboutYou", "skillsExperience");
  const languagesEnabled =
    sectionEnabled("aboutYou") &&
    subsectionEnabled("aboutYou", "personalInformation");
  const hasStoryContext =
    (storyEnabled &&
      Boolean(
        profile.skills.occupation ||
          profile.skills.uniqueSkills ||
          profile.skills.previousMinistryExperience ||
          profile.skills.leadershipExperience,
      )) ||
    (languagesEnabled && Boolean(profile.basicInformation.languages));
  if (hasStoryContext) {
    sentences.push(
      `${subject} work, skills, languages, and previous experience add practical context for how these themes could be expressed.`,
    );
  }

  if (synthesis.season) {
    sentences.push(
      `${subject} current season and stated capacity should shape the pace and size of any next step.`,
    );
  }

  return sentences;
}