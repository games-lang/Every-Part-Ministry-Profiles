export const CHURCH_TRADITIONS = [
  "wesleyanHoliness",
  "nazarene",
  "methodist",
  "baptist",
  "pentecostalCharismatic",
  "assembliesOfGod",
  "presbyterianReformed",
  "lutheran",
  "anglicanEpiscopal",
  "catholic",
  "easternOrthodox",
  "nonDenominational",
  "independentEvangelical",
  "other",
  "preferNotToSpecify",
] as const;

export const MINISTRY_CUSTOMIZATION_MODES = [
  "standard",
  "tradition",
  "custom",
] as const;

type ChurchTradition = (typeof CHURCH_TRADITIONS)[number];
type MinistryCustomizationMode =
  (typeof MINISTRY_CUSTOMIZATION_MODES)[number];

export type MinistryCustomization = {
  version: 1;
  mode: MinistryCustomizationMode;
  tradition: ChurchTradition;
  customTradition: string | null;
  spiritualGiftsLabel: string;
  ministryInterestsLabel: string;
};

const STANDARD_LABELS = {
  spiritualGiftsLabel: "Spiritual Gifts",
  ministryInterestsLabel: "Ministry Interests",
};

export function recommendedMinistryLabels(
  tradition: ChurchTradition,
): Pick<
  MinistryCustomization,
  "spiritualGiftsLabel" | "ministryInterestsLabel"
> {
  if (tradition === "catholic") {
    return {
      spiritualGiftsLabel: "Charisms & Gifts for Service",
      ministryInterestsLabel: "Parish Ministries",
    };
  }
  if (tradition === "easternOrthodox") {
    return {
      spiritualGiftsLabel: "Gifts for Service",
      ministryInterestsLabel: "Parish Ministries",
    };
  }
  if (tradition === "anglicanEpiscopal") {
    return {
      spiritualGiftsLabel: "Gifts for Ministry",
      ministryInterestsLabel: "Ministry Opportunities",
    };
  }
  return STANDARD_LABELS;
}

export function defaultMinistryCustomization(): MinistryCustomization {
  return {
    version: 1,
    mode: "standard",
    tradition: "preferNotToSpecify",
    customTradition: null,
    ...STANDARD_LABELS,
  };
}

function isLabel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 80
  );
}

export function ministryCustomization(
  value: unknown,
): MinistryCustomization | null {
  if (value == null) return defaultMinistryCustomization();
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const allowedKeys = new Set([
    "version",
    "mode",
    "tradition",
    "customTradition",
    "spiritualGiftsLabel",
    "ministryInterestsLabel",
  ]);
  if (Object.keys(candidate).some((key) => !allowedKeys.has(key))) return null;
  if (candidate.version !== 1) return null;
  if (
    !MINISTRY_CUSTOMIZATION_MODES.includes(
      candidate.mode as MinistryCustomizationMode,
    ) ||
    !CHURCH_TRADITIONS.includes(candidate.tradition as ChurchTradition)
  ) {
    return null;
  }

  const mode = candidate.mode as MinistryCustomizationMode;
  const tradition = candidate.tradition as ChurchTradition;
  const customTradition =
    typeof candidate.customTradition === "string" &&
    candidate.customTradition.trim()
      ? candidate.customTradition.trim()
      : null;
  if (
    (tradition === "other" && !customTradition) ||
    (customTradition && customTradition.length > 120)
  ) {
    return null;
  }

  const labels =
    mode === "standard"
      ? STANDARD_LABELS
      : mode === "tradition"
        ? recommendedMinistryLabels(tradition)
        : {
            spiritualGiftsLabel: candidate.spiritualGiftsLabel,
            ministryInterestsLabel: candidate.ministryInterestsLabel,
          };
  if (
    !isLabel(labels.spiritualGiftsLabel) ||
    !isLabel(labels.ministryInterestsLabel)
  ) {
    return null;
  }

  return {
    version: 1,
    mode,
    tradition,
    customTradition: tradition === "other" ? customTradition : null,
    spiritualGiftsLabel: labels.spiritualGiftsLabel.trim(),
    ministryInterestsLabel: labels.ministryInterestsLabel.trim(),
  };
}