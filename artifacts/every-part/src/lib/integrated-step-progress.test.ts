import assert from "node:assert/strict";
import test from "node:test";
import { resolveIntegratedResumeStep } from "./integrated-step-progress.ts";

const mergedSteps = [
  "aboutYou", "skillsExperience", "integratedPilot", "spiritualHealth",
  "connectionAvailability", "integratedOptional", "integratedReview",
];

test("old numeric-only drafts resume on the correct combined or later step", () => {
  assert.equal(resolveIntegratedResumeStep({ index: 4 }, mergedSteps, true), 4);
  assert.equal(resolveIntegratedResumeStep({ index: 5 }, mergedSteps, true), 4);
  assert.equal(resolveIntegratedResumeStep({ index: 6 }, mergedSteps, true), 5);
  assert.equal(resolveIntegratedResumeStep({ index: 7 }, mergedSteps, true), 6);
});

test("new drafts use their named step without shifting and old named Preferences maps to combined", () => {
  assert.equal(resolveIntegratedResumeStep({ index: 5, key: "integratedOptional" }, mergedSteps, true), 5);
  assert.equal(resolveIntegratedResumeStep({ index: 5, key: "integratedPreferences" }, mergedSteps, true), 4);
  assert.equal(resolveIntegratedResumeStep({ index: 100, key: "integratedReview" }, mergedSteps, true), 6);
});

test("a preferences-only church retains its step and drafts never resume beyond the wizard", () => {
  const preferenceOnly = ["aboutYou", "integratedPilot", "integratedPreferences", "integratedReview"];
  assert.equal(resolveIntegratedResumeStep({ index: 2, key: "integratedPreferences" }, preferenceOnly, false), 2);
  assert.equal(resolveIntegratedResumeStep({ index: 50 }, preferenceOnly, false), 3);
  assert.equal(resolveIntegratedResumeStep({ index: -2 }, preferenceOnly, false), 0);
});