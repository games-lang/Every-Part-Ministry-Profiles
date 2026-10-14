import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = (relative: string) => readFileSync(path.join(root, relative), "utf8");

test("profile and leadership copy use Formation Fit and people-first help labels", () => {
  assert.match(source("components/profile/leader-fit-section.tsx"), />Formation Fit<\/h3>/);
  for (const file of ["leader-ministry-profile", "my-ministry-profile"]) {
    assert.match(source(`components/profile/${file}.tsx`), /A healthy formation fit considers/);
  }
  assert.match(source("pages/leadership-profile.tsx"), /value: "find-volunteers", label: "Help people find their part"/);
});

test("feedback category labels change without changing stored category values", () => {
  const admin = source("pages/app-admin.tsx");
  assert.match(admin, /item.category === "ministry-matching" \? "Formation fit"/);
  assert.match(admin, /value === "ministry-matching" \? "Formation fit"/);
  assert.match(admin, /<option key=\{value\} value=\{value\}>/);
});

test("web copy, help articles and SEO sources do not reintroduce the retired phrases", () => {
  function check(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) check(filename);
      else if (/\.(tsx?|md|html)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        assert.doesNotMatch(readFileSync(filename, "utf8"), /\bministry fit\b|\bfind volunteers\b|\bministry matching\b/i, filename);
      }
    }
  }
  check(root);
});
