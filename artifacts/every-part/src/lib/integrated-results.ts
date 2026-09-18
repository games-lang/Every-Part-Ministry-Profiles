/**
 * Read-only adapter for the server's adult integrated result envelope.
 * Never scores answers, writes legacy sections, or falls back to legacy results
 * when an integrated envelope is present.
 */
export const INSUFFICIENT_EVIDENCE = "Not enough information yet";
export type IntegratedCategory = "APEST" | "Gift" | "Strength" | "Personality";
export type IntegratedConstruct = {
  category: IntegratedCategory;
  construct: string;
  mean: number | null;
  answeredCount: number;
  availableCount: number | null;
  eligible: boolean;
  evidence: "sufficient" | "insufficient";
  poles: string[] | null;
};
type Gate = (section: string) => boolean;
type SubGate = (section: string, subsection: string) => boolean;
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const sections: Record<IntegratedCategory, string> = {
  APEST: "apest", Gift: "spiritualGifts", Strength: "naturalStrengths", Personality: "personalityStrengths",
};
const subsectionKeys: Record<string, string> = {
  Apostle: "builder", Prophet: "insight", Evangelist: "connector", Shepherd: "caregiver", Teacher: "teacher",
  "Relational connection": "relationalConnection", Encouragement: "encouragement", "Teaching and explaining": "teachingExplaining",
  Listening: "listening", "Leadership and initiative": "leadershipInitiative", Organizing: "organizing",
  "Creative expression": "creativeExpression", "Problem-solving": "problemSolving", "Practical hands-on work": "practicalHandsOn",
  Hospitality: "hospitality", "Compassion and care": "compassionCare", "Communication and storytelling": "communicationStorytelling",
  Discernment: "discernment", "Follow-through": "followThrough", Adaptability: "adaptability",
  "Mentoring and development": "mentoringDevelopment", "Strategic thinking": "strategicThinking", "Advocacy and justice": "advocacyJustice",
  "Social Energy": "socialEnergy", "Decision Lens": "decisionLens", "Planning Style": "planningStyle",
  "Focus Style": "focusStyle", "Action Style": "actionStyle", "Pace Preference": "pacePreference", "Work Style": "workStyle",
};
const conversationOnly = new Set(["Healing", "Miracles", "Tongues", "Interpretation of Tongues", "Prophecy", "Discernment of Spirits"]);

export function integratedResults(profile: unknown, sectionEnabled: Gate, subsectionEnabled: SubGate) {
  const source = record(profile);
  if (source.integratedAssessment == null) return null;
  const envelope = record(source.integratedAssessment);
  const saved = record(source.assessmentConfiguration);
  const savedSections = record(saved.sections);
  const savedSubsections = record(saved.subsections);
  const snapshot = record(envelope.snapshot);
  const snapshotSections = record(record(snapshot.assessmentConfiguration).sections);
  const snapshotSubsections = record(record(snapshot.assessmentConfiguration).subsections);
  const enabled = (category: IntegratedCategory, construct: string) => {
    const section = sections[category];
    if (!sectionEnabled(section) || savedSections[section] === false || snapshotSections[section] === false) return false;
    // Gift toggles are a frozen list, not assessment subsections.
    if (category === "Gift") return Array.isArray(snapshot.enabledSpiritualGifts) && snapshot.enabledSpiritualGifts.includes(construct);
    const key = subsectionKeys[construct];
    return Boolean(key) && subsectionEnabled(section, key) && savedSubsections[`${section}.${key}`] !== false && snapshotSubsections[`${section}.${key}`] !== false;
  };
  const valid = envelope.version === "integrated-assessment-v1" &&
    envelope.bankVersion === "adult-integrated-83-v1" &&
    envelope.scoringVersion === "independent-weighted-mean-v1" && Array.isArray(envelope.constructs);
  const constructs: IntegratedConstruct[] = valid ? (envelope.constructs as unknown[]).flatMap(value => {
    const item = record(value);
    const category = item.category as IntegratedCategory;
    if (!Object.hasOwn(sections, category) || typeof item.construct !== "string" || !enabled(category, item.construct)) return [];
    if (category === "Gift" && conversationOnly.has(item.construct)) return [];
    const sufficient = item.eligible === true && item.evidence === "sufficient" &&
      typeof item.answeredCount === "number" && item.answeredCount >= 3 &&
      typeof item.mean === "number" && Number.isFinite(item.mean) && item.mean >= 1 && item.mean <= 5;
    return [{
      category, construct: item.construct, mean: sufficient ? item.mean as number : null,
      answeredCount: typeof item.answeredCount === "number" ? item.answeredCount : 0,
      availableCount: typeof item.availableCount === "number" ? item.availableCount : null,
      eligible: sufficient, evidence: sufficient ? "sufficient" as const : "insufficient" as const,
      poles: Array.isArray(item.poles) && item.poles.length === 2 && item.poles.every(pole => typeof pole === "string") ? item.poles as string[] : null,
    }];
  }) : [];
  const forCategory = (category: IntegratedCategory) => constructs.filter(item => item.category === category);
  const scored = (category: IntegratedCategory) => forCategory(category)
    .filter((item): item is IntegratedConstruct & { mean: number } => item.mean !== null)
    .sort((a, b) => b.mean - a.mean);
  // Only names/status are exposed. Optional answers (including text) never enter
  // the portrait or its print render tree.
  const optionalNames = valid && Array.isArray(envelope.optionalExperiences)
    ? envelope.optionalExperiences.flatMap(value => {
      const item = record(value);
      return typeof item.construct === "string" && conversationOnly.has(item.construct) && enabled("Gift", item.construct)
        ? [item.construct] : [];
    }) : [];
  const conversations = [...new Set([...optionalNames, ...(valid && Array.isArray(envelope.conversationOnlyGifts)
    ? envelope.conversationOnlyGifts.filter((name): name is string => typeof name === "string" && conversationOnly.has(name) && enabled("Gift", name)) : [])])];
  // Same positive-signal threshold as the canonical server's integratedSignals.
  // All eligible means remain available above; none are truncated or hidden.
  const signals = (category: IntegratedCategory) => scored(category).filter(item => item.mean >= 3.5);
  return { valid, constructs, forCategory, scored, signals, conversations };
}

export type PersonalityDefinition = readonly [string, string, string, string, string, string, string, string, string];

/** Map the canonical 1=left, 5=right mean directly, without invented responses. */
export function integratedPersonality(
  results: NonNullable<ReturnType<typeof integratedResults>>,
  definitions: readonly PersonalityDefinition[],
) {
  return results.scored("Personality").flatMap(result => {
    const definition = definitions.find(([, label]) => label === result.construct);
    if (!definition) return [];
    const [, label, left, right, leftExplanation, rightExplanation, leftSummary, rightSummary, ministry] = definition;
    const rightPercentage = Math.round((result.mean - 1) / 4 * 100);
    const leftPercentage = 100 - rightPercentage;
    // Percentages position the spectrum and feed the existing Serving Pattern
    // calculation; they must not override the canonical inclusive neutral band.
    const dominant = result.mean < 2.5 ? "left" as const : result.mean > 3.5 ? "right" as const : "balanced" as const;
    const tendency = dominant === "balanced" ? "Balanced / flexible" : dominant === "left" ? left : right;
    return [{ label, left, right, leftPercentage, rightPercentage, dominant, tendency, leftSummary, rightSummary, ministry,
      explanation: dominant === "left" ? leftExplanation : dominant === "right" ? rightExplanation : `You draw from both ${left.toLowerCase()} and ${right.toLowerCase()} approaches, adapting to what the situation requires.` }];
  });
}