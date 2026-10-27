import assert from "node:assert/strict";
import test from "node:test";
import { dataReadErrorCodes } from "./data-read-error";

test("data-read diagnostics expose nested database codes, never query parameters or messages", () => {
  const error = new Error("Failed query containing private values", {
    cause: Object.assign(new Error("private database detail"), {
      code: "42P01",
      detail: "private member information",
      query: "select private values",
      params: ["private-token"],
    }),
  });
  assert.deepEqual(dataReadErrorCodes(error), ["42P01"]);
});

test("data-read diagnostics recognize connection failures and tolerate missing or circular causes", () => {
  assert.deepEqual(dataReadErrorCodes({ cause: { code: "ECONNRESET" } }), ["ECONNRESET"]);
  assert.deepEqual(dataReadErrorCodes(new Error("no native code")), []);
  assert.deepEqual(dataReadErrorCodes(null), []);
  const error: { code: string; cause?: unknown } = { code: "08006" };
  error.cause = error;
  assert.deepEqual(dataReadErrorCodes(error), ["08006"]);
  assert.deepEqual(dataReadErrorCodes({ code: "not a code: private detail" }), []);
});
