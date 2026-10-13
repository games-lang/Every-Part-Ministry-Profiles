import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("./Shell.tsx", import.meta.url), "utf8");
const assistant = readFileSync(new URL("../partfinder-assistant.tsx", import.meta.url), "utf8");

test("leader navigation wraps into a full-width grid without a sticky click-intercepting overlay", () => {
  assert.match(shell, /grid w-full min-w-0 grid-cols-2/);
  assert.match(shell, /lg:grid-cols-8.*lg:grid-cols-7/);
  assert.doesNotMatch(shell, /sticky top-0|overflow-x-auto/);
});

test("PartFinder is in the normal header layout instead of floating over page actions", () => {
  assert.match(shell, /<header[\s\S]*<PartFinderAssistant \/>[\s\S]*<\/header>/);
  assert.equal(shell.match(/<PartFinderAssistant \/>/g)?.length, 1);
  assert.doesNotMatch(assistant, /position: "fixed"|zIndex: 1000/);
});

test("shared footer navigation wraps too, without reintroducing page overflow on narrow phones", () => {
  assert.match(shell, /<footer[\s\S]*flex flex-wrap items-center justify-between gap-3/);
  assert.match(shell, /<footer[\s\S]*flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2/);
});
