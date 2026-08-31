import type { MinistryProfile } from "@workspace/db";
import {
  DEFAULT_MINISTRY_INTERESTS,
  DEFAULT_PASSIONS,
} from "./assessment-configuration.ts";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts.ts";
import { adultProfilesOnly } from "./youth-profiles.ts";

const ADVISORY =
  "These are starting points for pastoral discernment, not placement decisions. Review the full profiles and talk with people before creating a team or inviting anyone to serve.";
const MAX_SUGGESTIONS = 4;
const MAX_SIGNALS = 18;
const MAX_CANDIDATES = 6;
const MINISTRY_TENDENCIES = [
  ["builder", "Starting and building new ministry"],
  ["insight", "Noticing what needs attention"],
  ["connector", "Connecting people with faith"],
  ["caregiver", "Caring for people over time"],
  ["teacher", "Making ideas clear"],
] as const;
const STRENGTHS = [
  ["relationalConnection", "Relational connection"],
  ["encouragement", "Encouragement"],
  ["teachingExplaining", "Teaching and explaining"],
  ["listening", "Listening"],
  ["leadershipInitiative", "Leadership and initiative"],
  ["organizing", "Organizing"],
  ["creativeExpression", "Creative expression"],
  ["problemSolving", "Problem-solving"],
  ["practicalHandsOn", "Practical hands-on work"],
  ["hospitality", "Hospitality"],
  ["compassionCare", "Compassion and care"],
  ["communicationStorytelling", "Communication and storytelling"],
  ["discernment", "Discernment"],
  ["followThrough", "Follow-through"],
  ["adaptability", "Adaptability"],
  ["mentoringDevelopment", "Mentoring and development"],
  ["strategicThinking", "Strategic thinking"],
  ["advocacyJustice", "Advocacy and justice"],
] as const;
const CANONICAL_PASSIONS = new Set<string>(DEFAULT_PASSIONS);
const CANONICAL_INTERESTS = new Set<string>(DEFAULT_MINISTRY_INTERESTS);
const CANONICAL_STRENGTHS = new Set<string>(STRENGTHS.map(([, label]) => label));
const CANONICAL_GIFTS = new Set<string>(SUPPORTED_SPIRITUAL_GIFT_NAMES);
const CANONICAL_TENDENCIES = new Set<string>(
  MINISTRY_TENDENCIES.map(([, label]) => label),
);

type Signal = {
  key: string;
  label: string;
  profileIds: number[];
};

type SafeProfile = {
  id: number;
  memberName: string;
  teamId: number | null;
  interests: string[];
  passions: string[];
  signals: Array<{ key: string; label: string }>;
};

export type TeamSuggestionResult = {
  suggestions: Array<{
    id: string;
    name: string;
    purpose: string;
    supportingSignals: string[];
    candidates: Array<{
      id: number;
      memberName: string;
      reasons: string[];
      interests: string[];
      passions: string[];
      isAssigned: boolean;
    }>;
  }>;
  summary: string;
  advisory: string;
  usedAi: boolean;
};

type TeamSuggestionCriteria = { focus?: string };

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().slice(0, 80))
    .filter(Boolean);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength)
    : "";
}

function topSpiritualGifts(value: unknown): string[] {
  const record = objectRecord(value);
  const historical = strings(record.topGifts);
  if (historical.length) return historical.slice(0, 5);
  const responses = objectRecord(record.responses);
  return Object.entries(responses)
    .map(([gift, entries]) => {
      const values = Array.isArray(entries)
        ? entries
            .map((entry) => objectRecord(entry).response)
            .filter((response): response is number => typeof response === "number")
        : [];
      return {
        gift,
        average: values.length
          ? values.reduce((total, response) => total + response, 0) / values.length
          : 0,
      };
    })
    .filter(({ average }) => average > 0)
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map(({ gift }) => gift);
}

function rankedLabels(
  value: unknown,
  definitions: readonly (readonly [string, string])[],
  count: number,
): string[] {
  const responses = objectRecord(objectRecord(value).responses);
  return definitions
    .map(([key, label]) => ({
      label,
      score: Object.entries(responses).reduce(
        (total, [responseKey, response]) =>
          new RegExp(`^${key}-\\d+$`).test(responseKey) &&
          typeof response === "number"
            ? total + response
            : total,
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ label }) => label);
}

function toSafeProfile(profile: MinistryProfile): SafeProfile {
  const strengths = objectRecord(profile.naturalStrengths);
  const ministry = objectRecord(profile.apest);
  const storedStrengths = strings(strengths.selected).slice(0, 5);
  const storedMinistryTendencies = [ministry.primary, ministry.secondary].filter(
    (value): value is string => typeof value === "string",
  );
  const values: Array<{ source: string; labels: string[] }> = [
    {
      source: "passion",
      labels: profile.passions.filter((label) => CANONICAL_PASSIONS.has(label)),
    },
    {
      source: "interest",
      labels: profile.interests.filter((label) => CANONICAL_INTERESTS.has(label)),
    },
    {
      source: "strength",
      labels: storedStrengths.length
        ? storedStrengths.filter((label) => CANONICAL_STRENGTHS.has(label))
        : rankedLabels(profile.naturalStrengths, STRENGTHS, 5),
    },
    {
      source: "gift",
      labels: topSpiritualGifts(profile.spiritualGifts).filter((label) =>
        CANONICAL_GIFTS.has(label),
      ),
    },
    {
      source: "ministry tendency",
      labels: storedMinistryTendencies.length
        ? storedMinistryTendencies.filter((label) =>
            CANONICAL_TENDENCIES.has(label),
          )
        : rankedLabels(profile.apest, MINISTRY_TENDENCIES, 2),
    },
  ];
  const signals = values.flatMap(({ source, labels }) =>
    labels
      .map((label) => cleanText(label, 80))
      .filter(Boolean)
      .map((label) => ({ key: `${source}:${slug(label)}`, label })),
  );
  return {
    id: profile.id,
    memberName: `${profile.firstName} ${profile.lastName}`,
    teamId: profile.teamId,
    interests: profile.interests,
    passions: profile.passions,
    signals,
  };
}

function buildSignals(profiles: SafeProfile[]): Signal[] {
  const byKey = new Map<string, Signal>();
  for (const profile of profiles) {
    for (const signal of profile.signals) {
      const current = byKey.get(signal.key) ?? {
        key: signal.key,
        label: signal.label,
        profileIds: [],
      };
      if (!current.profileIds.includes(profile.id)) {
        current.profileIds.push(profile.id);
      }
      byKey.set(signal.key, current);
    }
  }
  return [...byKey.values()]
    .filter((signal) => signal.profileIds.length > 0)
    .sort(
      (a, b) =>
        b.profileIds.length - a.profileIds.length ||
        a.label.localeCompare(b.label),
    )
    .slice(0, MAX_SIGNALS);
}

type AiSuggestion = {
  signalKeys: string[];
};

function parseAiResponse(value: unknown, validKeys: Set<string>): AiSuggestion[] {
  const record = objectRecord(value);
  if (!Array.isArray(record.suggestions)) return [];
  return record.suggestions
    .map((entry) => objectRecord(entry))
    .map((entry) => ({
      signalKeys: Array.isArray(entry.signalKeys)
        ? [...new Set(entry.signalKeys.filter((key): key is string => validKeys.has(key)))]
            .slice(0, 4)
        : [],
    }))
    .filter((suggestion) => suggestion.signalKeys.length > 0)
    .slice(0, MAX_SUGGESTIONS);
}

async function suggestWithOpenAi(
  signals: Signal[],
): Promise<AiSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !signals.length) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        max_completion_tokens: 1800,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "team_suggestions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["suggestions"],
              properties: {
                suggestions: {
                  type: "array",
                  maxItems: MAX_SUGGESTIONS,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["signalKeys"],
                    properties: {
                      signalKeys: {
                        type: "array",
                        minItems: 1,
                        maxItems: 4,
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        messages: [
          {
            role: "system",
            content:
              "Group canonical church ministry signals into up to four practical team themes. Return only supplied signal keys. Never create names, descriptions, reasons, or new labels. Do not infer protected traits, spiritual maturity, divine calling, willingness, availability, or certainty.",
          },
          {
            role: "user",
            content: JSON.stringify({
              availableSignals: signals.map(({ key, label, profileIds }) => ({
                key,
                label,
                profileCount: profileIds.length,
              })),
            }),
          },
        ],
      }),
    });
    if (!response.ok) return [];
    const payload = objectRecord(await response.json());
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const message = objectRecord(objectRecord(choices[0]).message);
    if (typeof message.content !== "string") return [];
    return parseAiResponse(JSON.parse(message.content), new Set(signals.map((signal) => signal.key)));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackSuggestions(signals: Signal[]): AiSuggestion[] {
  return signals.slice(0, MAX_SUGGESTIONS).map((signal) => ({
    signalKeys: [signal.key],
  }));
}

function signalText(signals: Signal[]): { name: string; purpose: string } {
  const labels = signals.map((signal) => signal.label).slice(0, 2);
  const joined = labels.join(" & ");
  return {
    name: `${joined} Team`.slice(0, 120),
    purpose: `A team that could explore serving around ${labels
      .map((label) => label.toLowerCase())
      .join(" and ")} and the people connected to it.`.slice(0, 320),
  };
}

function focusTerms(focus: string | undefined): Set<string> {
  return new Set(
    cleanText(focus, 240)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2),
  );
}

function prioritizeByFocus(signals: Signal[], focus: string | undefined): Signal[] {
  const requested = focusTerms(focus);
  if (!requested.size) return signals;
  return [...signals].sort((a, b) => {
    const score = (signal: Signal) =>
      signal.label
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => requested.has(term)).length;
    return score(b) - score(a);
  });
}

function normalizedTeamName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function materializeSuggestions(
  suggestions: AiSuggestion[],
  signals: Signal[],
  profiles: SafeProfile[],
  existingTeamNames: string[] = [],
): TeamSuggestionResult["suggestions"] {
  const signalByKey = new Map(signals.map((signal) => [signal.key, signal]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const existing = new Set(existingTeamNames.map(normalizedTeamName));
  return suggestions.map((suggestion, index) => {
    const selectedSignals = suggestion.signalKeys
      .map((key) => signalByKey.get(key))
      .filter((signal): signal is Signal => Boolean(signal));
    const candidateIds = [...new Set(selectedSignals.flatMap((signal) => signal.profileIds))];
    const candidates = candidateIds
      .map((id) => profilesById.get(id))
      .filter((profile): profile is SafeProfile => Boolean(profile))
      .sort((a, b) => Number(a.teamId !== null) - Number(b.teamId !== null) || a.memberName.localeCompare(b.memberName))
      .slice(0, MAX_CANDIDATES)
      .map((profile) => {
        const matchedLabels = profile.signals
          .filter((signal) => suggestion.signalKeys.includes(signal.key))
          .map((signal) => signal.label);
        return {
          id: profile.id,
          memberName: profile.memberName,
          reasons: [
            `Reflected ${matchedLabels.slice(0, 3).join(", ")}.`,
            ...(profile.teamId !== null ? ["Already assigned to a team; review before making any change."] : []),
          ],
          interests: profile.interests.slice(0, 5),
          passions: profile.passions.slice(0, 5),
          isAssigned: profile.teamId !== null,
        };
      });
    const text = signalText(selectedSignals);
    return {
      id: `suggestion-${index + 1}`,
      name: text.name,
      purpose: text.purpose,
      supportingSignals: selectedSignals.map((signal) => `${signal.label} (${signal.profileIds.length})`),
      candidates,
    };
  }).filter((suggestion) => !existing.has(normalizedTeamName(suggestion.name)));
}

export async function generateTeamSuggestions(
  profiles: MinistryProfile[],
  criteria: TeamSuggestionCriteria,
  existingTeamNames: string[] = [],
): Promise<TeamSuggestionResult> {
  const safeProfiles = adultProfilesOnly(profiles).map(toSafeProfile);
  const signals = prioritizeByFocus(buildSignals(safeProfiles), criteria.focus);
  if (!safeProfiles.length) {
    return {
      suggestions: [],
      summary: "No completed Ministry Profiles are available to explore yet.",
      advisory: ADVISORY,
      usedAi: false,
    };
  }
  if (!signals.length) {
    return {
      suggestions: [],
      summary: "The completed profiles do not yet contain enough shared ministry signals to suggest team themes.",
      advisory: ADVISORY,
      usedAi: false,
    };
  }
  const aiSignals = signals.filter((signal) => signal.profileIds.length >= 2);
  const aiSuggestions = await suggestWithOpenAi(aiSignals);
  const suggestions = aiSuggestions.length ? aiSuggestions : fallbackSuggestions(signals);
  return {
    suggestions: materializeSuggestions(
      suggestions,
      signals,
      safeProfiles,
      existingTeamNames,
    ),
    summary: aiSuggestions.length
      ? "AI grouped shared ministry signals into possible team themes. The supporting reasons below are calculated from the submitted profiles."
      : process.env.OPENAI_API_KEY
        ? "AI was temporarily unavailable, so these starter ideas use the most common shared ministry signals."
        : "AI assistance is not currently available, so these starter ideas use the most common shared ministry signals.",
    advisory: ADVISORY,
    usedAi: aiSuggestions.length > 0,
  };
}

export const teamSuggestionInternals = {
  buildSignals,
  fallbackSuggestions,
  materializeSuggestions,
  parseAiResponse,
  prioritizeByFocus,
  toSafeProfile,
};