import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const assessment = readFileSync(new URL("./assessment.tsx", import.meta.url), "utf8");
const setup = readFileSync(new URL("./church-setup.tsx", import.meta.url), "utf8");

test("new adult starts expose no classic selection, including the reflection fallback", () => {
  assert.doesNotMatch(assessment, /Use (?:the )?standard (?:adult )?assessment instead/);
  assert.doesNotMatch(assessment, /setDraftDialog\("classic"\)|setFlowAtStart\("classic"\)/);
  assert.doesNotMatch(assessment, /integratedAssessmentPilotEnabled/);
  assert.match(assessment, /setFlowAtStart\("integrated"\)/);
  assert.match(assessment, /Discard draft and start fresh/);
  assert.match(assessment, /await integrated\.discard\(\)/);
});

test("new starts are integrated while an already-running classic flow stays classic", () => {
  // Exercise the actual selection expression rather than duplicating its rule.
  const expression = assessment.match(/const integratedPilotEnabled = ([\s\S]*?);/)?.[1];
  assert.ok(expression);
  const isIntegrated = new Function("integratedAttempt", "integrated", "started", "flowAtStart", `return ${expression};`);
  for (const previousFormat of [null, "classic", "integrated"]) {
    assert.equal(isIntegrated(null, { hasDraft: false }, false, previousFormat), true);
  }
  assert.equal(isIntegrated(null, { hasDraft: false }, true, "classic"), false);
  assert.equal(isIntegrated(null, { hasDraft: false }, true, "integrated"), true);
  assert.equal(isIntegrated({}, { hasDraft: true }, true, "classic"), true, "frozen integrated drafts retain precedence");
  // Classic steps and the original profile submission path remain present.
  assert.match(assessment, /"apest",\s*"spiritualGifts",\s*"naturalStrengths",\s*"personalityStrengths"/);
  assert.match(assessment, /createProfile\.mutate/);
});

test("church setup has no format editor or format-only state and estimates integrated", () => {
  assert.doesNotMatch(setup, /integrated-pilot-editor|Adult assessment format|classicAdultAssessment|saveIntegratedPilot|updateIntegratedPilot|pilotSaveError/);
  assert.match(setup, /estimateAssessmentTime\(\s*assessmentConfiguration,\s*form\.watch\("enabledSpiritualGifts"\),\s*"integrated"/);
});
