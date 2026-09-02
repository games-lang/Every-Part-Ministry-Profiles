import type {
  MinistryCustomization,
  MinistryCustomizationTradition,
} from "@workspace/api-client-react";

export const CHURCH_TRADITIONS: Array<{
  value: MinistryCustomizationTradition;
  label: string;
}> = [
  { value: "wesleyanHoliness", label: "Wesleyan / Holiness" },
  { value: "nazarene", label: "Nazarene" },
  { value: "methodist", label: "Methodist" },
  { value: "baptist", label: "Baptist" },
  {
    value: "pentecostalCharismatic",
    label: "Pentecostal / Charismatic",
  },
  { value: "assembliesOfGod", label: "Assemblies of God" },
  {
    value: "presbyterianReformed",
    label: "Presbyterian / Reformed",
  },
  { value: "lutheran", label: "Lutheran" },
  { value: "anglicanEpiscopal", label: "Anglican / Episcopal" },
  { value: "catholic", label: "Catholic" },
  { value: "easternOrthodox", label: "Eastern Orthodox" },
  { value: "nonDenominational", label: "Non-Denominational" },
  {
    value: "independentEvangelical",
    label: "Independent Evangelical",
  },
  { value: "other", label: "Other" },
  { value: "preferNotToSpecify", label: "Prefer not to specify" },
];

export const STANDARD_MINISTRY_LABELS = {
  spiritualGiftsLabel: "Spiritual Gifts",
  ministryInterestsLabel: "Ministry Interests",
};

export function recommendedMinistryLabels(
  tradition: MinistryCustomizationTradition,
) {
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
  return STANDARD_MINISTRY_LABELS;
}

export const DEFAULT_MINISTRY_CUSTOMIZATION: MinistryCustomization = {
  version: 1,
  mode: "standard",
  tradition: "preferNotToSpecify",
  customTradition: null,
  ...STANDARD_MINISTRY_LABELS,
};