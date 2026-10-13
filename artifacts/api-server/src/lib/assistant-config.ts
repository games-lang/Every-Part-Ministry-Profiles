export function readAssistantConfig(env: Record<string, string | undefined> = process.env) {
  const configuredCap = env.ASSISTANT_DAILY_CAP;
  // Invalid caps fail closed; zero explicitly disables billable calls.
  const dailyCap = configuredCap === undefined ? 200
    : /^\d+$/.test(configuredCap) && Number.isSafeInteger(Number(configuredCap)) && Number(configuredCap) <= 2147483647
      ? Number(configuredCap)
      : 0;
  return { enabled: env.ASSISTANT_CHAT_ENABLED === "true", dailyCap };
}
