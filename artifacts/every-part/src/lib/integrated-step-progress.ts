/** Recover both newly saved step names and older numeric-only adult drafts. */
export function resolveIntegratedResumeStep(
  saved: { index: number; key?: string },
  stepKeys: readonly string[],
  mergedServingAndPreferences: boolean,
): number {
  const mergedIndex = stepKeys.indexOf("connectionAvailability");
  let index = saved.key && stepKeys.includes(saved.key)
    ? stepKeys.indexOf(saved.key)
    : saved.key === "integratedPreferences" && mergedIndex >= 0
      ? mergedIndex
      : saved.index;

  // Before the merge, Preferences immediately followed Connection. Older
  // drafts saved only an index, so shift that step and everything after it.
  if (!saved.key && mergedServingAndPreferences && mergedIndex >= 0 && saved.index > mergedIndex) {
    index = saved.index - 1;
  }
  return Math.min(Math.max(0, index), Math.max(0, stepKeys.length - 1));
}