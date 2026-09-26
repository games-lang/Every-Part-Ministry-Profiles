import type { AssessmentConfiguration } from "@workspace/api-client-react";

// Compact question-to-construct index of the integrated bank. Each row is
// one or more questions sharing the same mappings; a question counts once
// when any of its mappings is enabled.
const groups: [number, string][] = [
  [2, "A:Apostle|G:Apostleship|G:Leadership|S:Leadership and initiative"],
  [1, "A:Apostle|G:Administration|G:Apostleship|S:Organizing"],
  [3, "P:Social Energy"],
  [1, "G:Missionary / Cross-Cultural Ministry|S:Adaptability|S:Relational connection"],
  [1, "G:Administration|S:Organizing"],
  [1, "A:Apostle|G:Leadership|S:Leadership and initiative"],
  [3, "P:Focus Style"],
  [2, "A:Prophet|S:Discernment"],
  [3, "P:Action Style"],
  [1, "S:Advocacy and justice"],
  [1, "A:Evangelist|G:Evangelism|S:Relational connection"],
  [1, "G:Missionary / Cross-Cultural Ministry|S:Adaptability"],
  [3, "P:Decision Lens"],
  [1, "G:Hospitality|G:Missionary / Cross-Cultural Ministry|S:Adaptability|S:Hospitality"],
  [2, "A:Evangelist|G:Evangelism|S:Listening"],
  [3, "P:Work Style"],
  [1, "A:Shepherd|G:Pastoring / Shepherding|S:Compassion and care|S:Follow-through"],
  [3, "A:Prophet|S:Advocacy and justice"],
  [2, "A:Evangelist|G:Evangelism|S:Communication and storytelling"],
  [2, "A:Teacher|G:Knowledge|G:Teaching|S:Teaching and explaining"],
  [1, "A:Teacher|G:Teaching|S:Communication and storytelling|S:Teaching and explaining"],
  [1, "A:Teacher|G:Teaching|S:Listening|S:Teaching and explaining"],
  [1, "A:Teacher|G:Knowledge|S:Communication and storytelling"],
  [1, "A:Teacher|G:Teaching|S:Teaching and explaining"],
  [1, "A:Shepherd|G:Exhortation / Encouragement|G:Pastoring / Shepherding|S:Encouragement"],
  [1, "G:Hospitality|S:Hospitality"],
  [1, "G:Hospitality|S:Hospitality|S:Relational connection"],
  [2, "G:Music / Worship|S:Creative expression"],
  [1, "G:Craftsmanship|G:Music / Worship"],
  [2, "G:Exhortation / Encouragement|S:Encouragement"],
  [1, "A:Shepherd|G:Mercy|G:Pastoring / Shepherding|S:Follow-through"],
  [1, "A:Shepherd|G:Pastoring / Shepherding|S:Mentoring and development"],
  [1, "A:Shepherd|G:Mercy|G:Pastoring / Shepherding|S:Compassion and care"],
  [1, "G:Helps / Service|G:Mercy|S:Compassion and care"],
  [2, "G:Faith|G:Intercession"],
  [1, "G:Giving"],
  [1, "G:Intercession"],
  [1, "G:Helps / Service|S:Follow-through|S:Practical hands-on work"],
  [1, "G:Exhortation / Encouragement|G:Faith"],
  [1, "S:Problem-solving|S:Strategic thinking"],
  [1, "G:Wisdom|S:Discernment|S:Listening"],
  [1, "A:Prophet|G:Wisdom|S:Discernment"],
  [1, "G:Wisdom|S:Discernment"],
  [3, "P:Planning Style"],
  [1, "A:Apostle|G:Apostleship|S:Problem-solving|S:Strategic thinking"],
  [1, "A:Apostle|G:Administration|S:Organizing|S:Strategic thinking"],
  [1, "A:Evangelist|G:Evangelism|S:Mentoring and development"],
  [1, "A:Shepherd|G:Pastoring / Shepherding|S:Follow-through|S:Mentoring and development"],
  [1, "S:Problem-solving"],
  [3, "P:Pace Preference"],
  [1, "G:Giving|S:Organizing"],
  [1, "G:Craftsmanship|G:Helps / Service|S:Creative expression|S:Practical hands-on work"],
  [1, "G:Craftsmanship|G:Helps / Service|S:Practical hands-on work"],
  [3, "G:Celibacy"],
  [2, "G:Giving|G:Voluntary Poverty"],
  [1, "G:Voluntary Poverty"],
];

const apest: Record<string, string> = {
  Apostle: "builder", Prophet: "insight", Evangelist: "connector",
  Shepherd: "caregiver", Teacher: "teacher",
};
const strengths: Record<string, string> = {
  "Relational connection": "relationalConnection", Encouragement: "encouragement",
  "Teaching and explaining": "teachingExplaining", Listening: "listening",
  "Leadership and initiative": "leadershipInitiative", Organizing: "organizing",
  "Creative expression": "creativeExpression", "Problem-solving": "problemSolving",
  "Practical hands-on work": "practicalHandsOn", Hospitality: "hospitality",
  "Compassion and care": "compassionCare",
  "Communication and storytelling": "communicationStorytelling",
  Discernment: "discernment", "Follow-through": "followThrough",
  Adaptability: "adaptability", "Mentoring and development": "mentoringDevelopment",
  "Strategic thinking": "strategicThinking", "Advocacy and justice": "advocacyJustice",
};
const personality: Record<string, string> = {
  "Social Energy": "socialEnergy", "Decision Lens": "decisionLens",
  "Planning Style": "planningStyle", "Focus Style": "focusStyle",
  "Action Style": "actionStyle", "Pace Preference": "pacePreference",
  "Work Style": "workStyle",
};

export function integratedQuestionCount(
  configuration: AssessmentConfiguration,
  enabledGifts: string[],
  celibacyEligible = false,
): number {
  const { sections, subsections } = configuration;
  const gifts = new Set(enabledGifts);
  return groups.reduce((total, [count, mappings]) => total + (
    mappings.split("|").some((entry) => {
      const category = entry[0];
      const construct = entry.slice(2);
      if (category === "G") return sections.spiritualGifts && gifts.has(construct) && (construct !== "Celibacy" || celibacyEligible);
      if (category === "A") return sections.apest && subsections[`apest.${apest[construct]}` as keyof typeof subsections];
      if (category === "S") return sections.naturalStrengths && subsections[`naturalStrengths.${strengths[construct]}` as keyof typeof subsections];
      return sections.personalityStrengths && subsections[`personalityStrengths.${personality[construct]}` as keyof typeof subsections];
    }) ? count : 0
  ), 0);
}