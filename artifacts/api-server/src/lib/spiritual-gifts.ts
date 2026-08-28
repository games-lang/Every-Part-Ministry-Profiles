export const SUPPORTED_SPIRITUAL_GIFT_NAMES = [
  "Administration", "Apostleship", "Discernment of Spirits", "Evangelism",
  "Exhortation / Encouragement", "Faith", "Giving", "Healing",
  "Helps / Service", "Hospitality", "Interpretation of Tongues", "Knowledge",
  "Leadership", "Mercy", "Miracles", "Pastoring / Shepherding", "Prophecy",
  "Teaching", "Tongues", "Wisdom", "Craftsmanship", "Intercession",
  "Missionary / Cross-Cultural Ministry", "Music / Worship", "Celibacy",
  "Voluntary Poverty",
] as const;

const supportedGiftNames = new Set<string>(SUPPORTED_SPIRITUAL_GIFT_NAMES);

export function validateEnabledSpiritualGifts(
  enabledSpiritualGifts: readonly string[],
): string | null {
  if (
    enabledSpiritualGifts.length < 3 ||
    new Set(enabledSpiritualGifts).size !== enabledSpiritualGifts.length
  ) {
    return "Enable at least three distinct supported spiritual gifts.";
  }
  if (enabledSpiritualGifts.some((gift) => !supportedGiftNames.has(gift))) {
    return "Enabled spiritual gifts must be supported gift names.";
  }
  return null;
}

export function activeSpiritualGifts(
  enabledSpiritualGifts: string[] | null,
): string[] | null {
  if (enabledSpiritualGifts === null) return [...SUPPORTED_SPIRITUAL_GIFT_NAMES];
  return validateEnabledSpiritualGifts(enabledSpiritualGifts)
    ? null
    : enabledSpiritualGifts;
}

export function spiritualGiftsSubmissionError(
  spiritualGifts: {
    topGifts: string[];
    responses: Record<string, { prompt: string; response: number }[]>;
  },
  activeGifts: readonly string[],
): string | null {
  const active = new Set(activeGifts);
  if (
    spiritualGifts.topGifts.length < 3 ||
    spiritualGifts.topGifts.length > 5 ||
    new Set(spiritualGifts.topGifts).size !== spiritualGifts.topGifts.length ||
    spiritualGifts.topGifts.some((gift) => !active.has(gift))
  ) {
    return "Choose three to five distinct enabled spiritual gifts.";
  }

  const responseGifts = Object.keys(spiritualGifts.responses);
  if (
    responseGifts.length !== activeGifts.length ||
    responseGifts.some((gift) => !active.has(gift)) ||
    activeGifts.some((gift) => !Object.hasOwn(spiritualGifts.responses, gift))
  ) {
    return "Please provide responses for every enabled spiritual gift only.";
  }

  for (const gift of activeGifts) {
    const responses = spiritualGifts.responses[gift];
    if (
      !responses ||
      responses.length !== 3 ||
      responses.some(
        (entry) =>
          !entry.prompt.trim() ||
          !Number.isInteger(entry.response) ||
          entry.response < 1 ||
          entry.response > 5,
      )
    ) {
      return `Each enabled spiritual gift requires three valid responses (${gift}).`;
    }
  }
  return null;
}