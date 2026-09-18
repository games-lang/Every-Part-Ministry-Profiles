import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const exported: any = {};
const compiled = ts.transpileModule(readFileSync(new URL("./integrated-reflections.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
runInNewContext(compiled, {
  exports: exported,
  require: (name: string) => name === "@/components/ui/button"
    ? { Button: ({ variant: _variant, ...props }: any) => React.createElement("button", props) }
    : require(name),
});
const attempt = {
  responseModels: {
    reflectionLikert: {
      anchors: ["Not at all like me", "A little like me", "Sometimes like me", "Often like me", "Very much like me"],
      instructions: "Answer from recurring actual behavior.",
      na: "N/A — Not sure / I have not had the opportunity",
    },
    personalityBipolar: {
      anchors: ["Strongly left pole", "Slightly left pole", "Balanced / both fit", "Slightly right pole", "Strongly right pole"],
      na: "N/A — Not sure / I have not had the opportunity",
    },
  },
};
test("reflection renderer uses exact server text, anchors and poles, without construct tags", () => {
  const html = renderToStaticMarkup(React.createElement(exported.IntegratedReflections, {
    attempt,
    questions: [
      { id: "one", text: "The approved unchanged reflection.", responseModel: "reflectionLikert", construct: "Hidden gift tag" },
      { id: "two", text: "The approved bipolar reflection.", responseModel: "personalityBipolar", poles: ["Reflective", "Interactive"] },
    ],
    answers: { one: 5 }, onAnswer() {},
  }));
  assert.match(html, /The approved unchanged reflection\./);
  assert.match(html, /Not at all like me/);
  assert.match(html, /Strongly left pole/);
  assert.match(html, /1 — Reflective/);
  assert.match(html, /5 — Interactive/);
  assert.match(html, /aria-pressed="true"/);
  assert.doesNotMatch(html, /Hidden gift tag/);
});

test("optional questions are distinguishable without gift metadata; a core round renders at most eight", () => {
  const questions = Array.from({ length: 83 }, (_, i) => ({ id: `q${i}`, text: `Reflection ${i}`, responseModel: "reflectionLikert" }));
  questions.push({ id: "optional", text: "Optional experience", responseModel: "specialExperienceLikert" });
  const core = questions.filter(q => !exported.isOptionalReflection(q));
  assert.equal(core.length, 83);
  assert.equal(questions.filter(exported.isOptionalReflection).length, 1);
  const html = renderToStaticMarkup(React.createElement(exported.IntegratedReflections, {
    attempt, questions: core.slice(0, exported.INTEGRATED_ROUND_SIZE), answers: {}, onAnswer() {},
  }));
  assert.equal((html.match(/<fieldset/g) ?? []).length, 8);
  assert.doesNotMatch(html, /Optional experience/);
  assert.doesNotMatch(html, /Reflection 82/);
});