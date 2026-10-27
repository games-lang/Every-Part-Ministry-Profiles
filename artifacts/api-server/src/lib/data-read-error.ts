// Drizzle wraps the useful PostgreSQL/connection code in `cause`. Do not log
// messages, query text, parameters, or entire errors: they can contain member data.
export function dataReadErrorCodes(error: unknown): string[] {
  const codes = new Set<string>();
  const seen = new Set<unknown>();
  let current = error;
  while (current && typeof current === "object" && !seen.has(current) && seen.size < 8) {
    seen.add(current);
    const entry = current as { code?: unknown; cause?: unknown };
    if (typeof entry.code === "string" && /^(?:[A-Z0-9]{5}|E[A-Z_]{3,30})$/.test(entry.code)) {
      codes.add(entry.code);
    }
    current = entry.cause;
  }
  return [...codes];
}
