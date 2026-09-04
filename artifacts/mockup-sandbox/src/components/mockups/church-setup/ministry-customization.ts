export const CHURCH_TRADITIONS = [
  { value: "wesleyanHoliness", label: "Wesleyan / Holiness" }, { value: "nazarene", label: "Nazarene" }, { value: "methodist", label: "Methodist" },
  { value: "baptist", label: "Baptist" }, { value: "pentecostalCharismatic", label: "Pentecostal / Charismatic" }, { value: "assembliesOfGod", label: "Assemblies of God" },
  { value: "presbyterianReformed", label: "Presbyterian / Reformed" }, { value: "lutheran", label: "Lutheran" }, { value: "anglicanEpiscopal", label: "Anglican / Episcopal" },
  { value: "catholic", label: "Catholic" }, { value: "easternOrthodox", label: "Eastern Orthodox" }, { value: "nonDenominational", label: "Non-Denominational" },
  { value: "independentEvangelical", label: "Independent Evangelical" }, { value: "other", label: "Other" }, { value: "preferNotToSpecify", label: "Prefer not to specify" },
] as const;
export const STANDARD_MINISTRY_LABELS = { spiritualGiftsLabel: "Spiritual Gifts", ministryInterestsLabel: "Ministry Interests" };
export const DEFAULT_MINISTRY_CUSTOMIZATION = { version: 1 as const, mode: "standard" as const, tradition: "preferNotToSpecify" as const, customTradition: null, ...STANDARD_MINISTRY_LABELS };
export const recommendedMinistryLabels = (_tradition: string) => STANDARD_MINISTRY_LABELS;
export const recommendedSpiritualGifts = (_tradition: string, gifts: readonly string[]) => [...gifts];
export const excludedSpiritualGifts = (_tradition: string) => [] as string[];