import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const bank = JSON.parse(readFileSync(new URL("../../../api-server/src/lib/integrated-bank.json", import.meta.url), "utf8"));
const source = ts.transpileModule(readFileSync(new URL("./integrated-question-count.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports: { integratedQuestionCount: (configuration: any, gifts: string[], celibacyEligible?: boolean) => number } = {} as any;
runInNewContext(source, { exports });

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
  "Compassion and care": "compassionCare", "Communication and storytelling": "communicationStorytelling",
  Discernment: "discernment", "Follow-through": "followThrough", Adaptability: "adaptability",
  "Mentoring and development": "mentoringDevelopment", "Strategic thinking": "strategicThinking",
  "Advocacy and justice": "advocacyJustice",
};
const personality: Record<string, string> = {
  "Social Energy": "socialEnergy", "Decision Lens": "decisionLens", "Planning Style": "planningStyle",
  "Focus Style": "focusStyle", "Action Style": "actionStyle", "Pace Preference": "pacePreference",
  "Work Style": "workStyle",
};

test("integrated count tracks the real bank under default and custom church choices", () => {
  const gifts = [...new Set<string>(bank.coreQuestions.flatMap((q: any) => q.maps.filter((m: any) => m.category === "Gift").map((m: any) => m.construct)))];
  const configuration = {
    sections: { aboutYou: true, apest: true, spiritualGifts: true, passionsInterests: true, naturalStrengths: true, personalityStrengths: true, spiritualHealth: true, connectionAvailability: true },
    subsections: Object.fromEntries(bank.coreQuestions.flatMap((q: any) => q.maps.filter((m: any) => m.category !== "Gift").map((m: any) => {
      const prefix = m.category === "APEST" ? "apest" : m.category === "Strength" ? "naturalStrengths" : "personalityStrengths";
      const key = m.category === "APEST" ? apest[m.construct] : m.category === "Strength" ? strengths[m.construct] : personality[m.construct];
      return [`${prefix}.${key}`, true];
    }))),
  };
  const expected = (eligible: boolean) => bank.coreQuestions.filter((q: any) =>
    q.maps.some((m: any) => {
      if (m.category === "Gift") return configuration.sections.spiritualGifts && gifts.includes(m.construct) && (eligible || m.construct !== "Celibacy");
      const prefix = m.category === "APEST" ? "apest" : m.category === "Strength" ? "naturalStrengths" : "personalityStrengths";
      const key = m.category === "APEST" ? apest[m.construct] : m.category === "Strength" ? strengths[m.construct] : personality[m.construct];
      return configuration.sections[prefix as keyof typeof configuration.sections] && configuration.subsections[`${prefix}.${key}`];
    })
  ).length;
  assert.equal(exports.integratedQuestionCount(configuration, gifts), expected(false));
  assert.equal(exports.integratedQuestionCount(configuration, gifts, true), expected(true));
  assert.equal(expected(false), 80);
  for (const key of ["apest", "spiritualGifts", "naturalStrengths", "personalityStrengths"] as const) {
    const without = { ...configuration, sections: { ...configuration.sections, [key]: false } };
    const count = bank.coreQuestions.filter((q: any) => q.maps.some((m: any) => {
      const prefix = m.category === "APEST" ? "apest" : m.category === "Gift" ? "spiritualGifts" : m.category === "Strength" ? "naturalStrengths" : "personalityStrengths";
      return without.sections[prefix] && (m.category === "Gift"
        ? gifts.includes(m.construct) && m.construct !== "Celibacy"
        : configuration.subsections[`${prefix}.${m.category === "APEST" ? apest[m.construct] : m.category === "Strength" ? strengths[m.construct] : personality[m.construct]}`]);
    })).length;
    assert.equal(exports.integratedQuestionCount(without, gifts), count, `${key} disabled`);
  }
});