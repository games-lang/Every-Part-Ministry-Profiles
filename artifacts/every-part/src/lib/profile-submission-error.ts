const FALLBACK =
  "We couldn’t submit your profile right now. Please try again.";

function serverErrorMessage(error: Error) {
  const candidate = error as Error & {
    status?: unknown;
    data?: unknown;
  };
  if (
    typeof candidate.status !== "number" ||
    candidate.status < 400 ||
    candidate.status >= 500 ||
    !candidate.data ||
    typeof candidate.data !== "object"
  ) {
    return null;
  }
  const message = (candidate.data as { error?: unknown }).error;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

export function profileSubmissionError(error: unknown) {
  if (!(error instanceof Error)) return FALLBACK;
  return (
    serverErrorMessage(error) ??
    (error.message.includes("plan limit")
      ? error.message.replace(/^HTTP \d+ [^:]+:\s*/, "")
      : FALLBACK)
  );
}