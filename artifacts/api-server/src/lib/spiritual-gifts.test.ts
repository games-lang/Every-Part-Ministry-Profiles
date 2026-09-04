import assert from "node:assert/strict";
import test from "node:test";
import { spiritualGiftsSubmissionError } from "./spiritual-gifts.ts";

const activeGifts = ["Administration", "Hospitality"];

function responses(count: number) {
  return {
    responses: Object.fromEntries(
      activeGifts.map((gift) => [
        gift,
        Array.from({ length: count }, (_, index) => ({
          prompt: `${gift} reflection ${index + 1}`,
          response: 4,
        })),
      ]),
    ),
  };
}

test("spiritual gift submissions accept the church's exact question count", () => {
  for (const questionCount of [1, 2, 3, 4]) {
    assert.equal(
      spiritualGiftsSubmissionError(
        responses(questionCount),
        activeGifts,
        questionCount,
      ),
      null,
    );
  }
});

test("spiritual gift submissions reject a different question count", () => {
  assert.match(
    spiritualGiftsSubmissionError(responses(2), activeGifts, 4) ?? "",
    /requires 4 valid responses/,
  );
  assert.match(
    spiritualGiftsSubmissionError(responses(4), activeGifts, 1) ?? "",
    /requires 1 valid response/,
  );
});