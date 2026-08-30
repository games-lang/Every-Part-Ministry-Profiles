export function joinWithAnd(items: string[]): string {
  const parts = items.map((item) => item.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function lowerFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const first = trimmed[0];
  if (first !== first.toLowerCase() && trimmed.slice(1) === trimmed.slice(1).toLowerCase()) {
    return first.toLowerCase() + trimmed.slice(1);
  }
  return trimmed;
}

export function personalitySummarySentence(
  descriptors: string[],
  ministries: string[] = [],
): string {
  const traits = descriptors.map(lowerFirst).filter(Boolean);
  if (traits.length === 0) {
    return "You tend to draw from both sides of these dimensions, adapting your approach to the people and situations around you.";
  }
  const shaped = joinWithAnd(ministries);
  const shapedSentence = shaped ? ` These tendencies may shape ${shaped}.` : "";
  return `You tend to operate as someone who is ${joinWithAnd(traits)}.${shapedSentence}`;
}
