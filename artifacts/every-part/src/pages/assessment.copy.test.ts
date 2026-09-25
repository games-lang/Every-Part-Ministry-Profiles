import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const assessment = readFileSync(new URL("./assessment.tsx", import.meta.url), "utf8").replace(/\s+/g, " ");

test("integrated participant copy retains the exact agreed wording", () => {
  assert.ok(assessment.includes("When you finish, you'll see a gentle summary of what came through in your responses — patterns, not a verdict. The fullest picture emerges in a conversation with your ministry leader."));
  assert.ok(assessment.includes("What stood out in your responses"));
  assert.ok(assessment.includes("This is a starting point, not a verdict — these themes are meant to spark a conversation with your ministry leader, not to define you."));
  assert.ok(assessment.includes("These reflections are optional and unscored. They are conversation starters, not proof of a gift. Let them spark honest reflection — there is no score attached."));
  assert.ok(assessment.includes("Pastoral self-reflection only — never pass/fail or scored. Share only what you are comfortable sharing."));
  assert.match(assessment, /<strong>A few quick preferences<\/strong> — For the next set, pick the side that feels more like you\. There are no right answers, and these simply add texture to your profile\./);
});