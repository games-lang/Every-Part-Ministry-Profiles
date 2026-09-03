const FALLBACK =
  "We couldn’t submit your profile right now. Please check your connection and try again.";

export function profileSubmissionError(error: unknown) {
  if (!(error instanceof Error) || !error.message.includes("plan limit")) {
    return FALLBACK;
  }
  return error.message.replace(/^HTTP \d+ [^:]+:\s*/, "");
}