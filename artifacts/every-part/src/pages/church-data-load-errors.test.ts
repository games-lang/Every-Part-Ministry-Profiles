import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("entry and adult assessment reserve church-not-found copy for 404 and allow retry after server failures", () => {
  for (const page of ["age-gateway.tsx", "assessment.tsx"]) {
    const source = readFileSync(new URL(page, import.meta.url), "utf8");
    assert.match(source, /churchError\?\.status === 404/);
    assert.match(source, /We couldn’t load this church right now/);
    assert.match(source, /onClick=\{\(\) => void refetchChurch\(\)\}/);
  }
});
