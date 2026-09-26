import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// A deterministic hook-state harness: exercise the real hook's asynchronous
// queue/storage logic without a running app, DOM, network or third-party runner.
const source = ts.transpileModule(readFileSync(new URL("./use-integrated-attempt.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
function view(revision = 0) {
  return {
    attemptId: "draft-1", token: "private-device-token", revision, status: "draft",
    expiresAt: "2099-01-01", bankVersion: "bank-v1", scoringVersion: "score-v1",
    snapshot: { assessmentConfiguration: { sections: {}, subsections: {} }, ministryCustomization: {}, enabledSpiritualGifts: [] },
    responseModels: {}, questions: [{ id: "q1", text: "Approved text", responseModel: "reflectionLikert" }],
    answers: {}, formState: {},
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness(options: { storage?: Map<string, string>; api?: Record<string, (...args: any[]) => any> } = {}) {
  const slots: any[] = [];
  const effects: Array<() => void> = [];
  const storage = options.storage ?? new Map<string, string>();
  const timers = new Map<number, () => void>();
  const restored: any[] = [];
  let cursor = 0, changed = true, timerId = 0;
  let result: any;
  let churchId = 42;
  let server: any = view();
  const calls: any[] = [];
  const api = {
    startIntegratedAttempt: async () => clone(server),
    getIntegratedAttempt: async () => clone(server),
    saveIntegratedAttempt: async (_church: number, _id: string, payload: any) => {
      calls.push(clone(payload));
      server = { ...server, ...clone(payload), revision: payload.revision + 1 };
      return clone(server);
    },
    ...options.api,
  };
  const same = (a: any[], b: any[]) => a && b && a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
  const hooks = {
    useState(initial: any) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, (next: any) => {
        const value = typeof next === "function" ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; changed = true; }
      }];
    },
    useRef(initial: any) {
      const index = cursor++;
      return slots[index] ?? (slots[index] = { current: initial });
    },
    useCallback(fn: any, deps: any[]) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { fn, deps };
      return slots[index].fn;
    },
    useEffect(fn: any, deps: any[]) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) {
        const previous = slots[index];
        slots[index] = { deps };
        effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = fn(); });
      }
    },
  };
  const exported: any = {};
  runInNewContext(source, {
    exports: exported,
    require: (name: string) => name === "react" ? hooks : api,
    TextEncoder, console,
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    window: { addEventListener() {}, removeEventListener() {} },
    setTimeout: (fn: () => void) => { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: (id: number) => timers.delete(id),
  });
  function render() {
    let limit = 30;
    do {
      changed = false; cursor = 0;
      result = exported.useIntegratedAttempt(churchId, (value: any) => restored.push(clone(value)));
      while (effects.length) effects.shift()!();
      if (!--limit) throw new Error("Hook did not settle");
    } while (changed);
    return result;
  }
  async function tick() {
    await new Promise(resolve => setImmediate(resolve));
    return render();
  }
  render();
  return {
    render, tick, storage, restored, calls, exported,
    get result() { return render(); },
    setServer(value: any) { server = clone(value); },
    switchChurch(id: number) { churchId = id; return render(); },
    async start(form: any = {}) {
      await tick();
      await result.start({ adultConfirmed: true, celibacyEligible: false, optionalExperienceOptIn: false }, form);
      return tick();
    },
  };
}

test("draft form allowlist strips all legacy assessment responses and private/helper keys", () => {
  const h = harness();
  const result = h.exported.draftFormState({
    basicInformation: { firstName: "Pat" }, round: 2, _stepIndex: 3, occupation: "Teacher",
    spiritualGifts: {}, ministryResponses: {}, personalityResponses: {}, strengthResponses: {},
    integratedAttempt: { token: "secret" }, token: "secret", _adultConfirmed: true,
  });
  assert.deepEqual(clone(result), { basicInformation: { firstName: "Pat" }, round: 2, _stepIndex: 3, occupation: "Teacher" });
});

test("single-flight queue uses latest revision and drains edits made during an in-flight save", async () => {
  const first = deferred<any>();
  const calls: any[] = [];
  const h = harness({ api: { saveIntegratedAttempt: async (_c, _a, payload) => {
    calls.push(clone(payload));
    return calls.length === 1 ? first.promise : { ...view(payload.revision + 1), ...clone(payload), revision: payload.revision + 1 };
  } } });
  await h.start({ _stepIndex: 2 });
  h.result.setAnswer("q1", 5);
  h.result.updateForm({ _stepIndex: 3, round: 4, lifeNotes: "Newest form edit" });
  const flushed = h.result.flush();
  assert.equal(calls.length, 1);
  first.resolve(view(1));
  const final = await flushed;
  await h.tick();
  assert.equal(final.revision, 2);
  assert.deepEqual(calls.map(c => c.revision), [0, 1]);
  assert.deepEqual(calls[1].answers, { q1: 5 });
  assert.equal(calls[1].formState.round, 4);
  assert.equal(h.result.answers.q1, 5);
  assert.equal(h.result.dirty, false);
});

test("explicit final flush closes the debounce gap and returns acknowledged credentials", async () => {
  const h = harness();
  await h.start();
  h.result.setAnswer("q1", "na");
  const backup = JSON.parse(h.storage.get("ep_integrated_token_42")!);
  assert.equal(backup.dirty, true);
  assert.equal(backup.answers.q1, "na");
  const saved = await h.result.flush();
  assert.equal(saved.revision, 2);
  assert.equal(h.calls.at(-1).answers.q1, "na");
  assert.equal(h.result.dirty, false);
});

test("anonymous answers and step survive remount before the debounced save", async () => {
  const h = harness();
  await h.start({ basicInformation: { firstName: "Pat" }, _stepIndex: 2, currentStep: "integratedPilot" });
  h.result.setAnswer("q1", 4);
  h.result.updateForm({ basicInformation: { firstName: "Pat" }, _stepIndex: 2, currentStep: "integratedPilot", questionIndex: 1 });
  const backup = JSON.parse(h.storage.get("ep_integrated_token_42")!);
  assert.equal(backup.dirty, true);
  // A new hook instance models reloading or returning to the page before
  // the debounce reaches the server; the same device storage is retained.
  const returned = harness({ storage: h.storage, api: { getIntegratedAttempt: async () => view(1) } });
  await returned.tick();
  assert.equal(returned.result.hasDraft, true);
  assert.equal(returned.result.answers.q1, 4);
  assert.equal(returned.restored.at(-1).questionIndex, 1);
  assert.equal(returned.restored.at(-1).basicInformation.firstName, "Pat");
});

test("409 preserves local answers and form until explicit local retry at server revision", async () => {
  let conflict = false;
  const calls: any[] = [];
  const remote = { ...view(9), answers: { q1: 1 }, formState: { lifeNotes: "Server copy" } };
  const h = harness({ api: {
    getIntegratedAttempt: async () => remote,
    saveIntegratedAttempt: async (_c, _id, data) => {
      calls.push(clone(data));
      if (conflict) throw { status: 409, data: { error: "Revision changed" } };
      return { ...view(data.revision + 1), ...clone(data), revision: data.revision + 1 };
    },
  } });
  await h.start();
  h.result.setAnswer("q1", 5);
  h.result.updateForm({ lifeNotes: "My local copy", round: 3 });
  conflict = true;
  assert.equal(await h.result.flush(), null);
  assert.equal(h.result.answers.q1, 5);
  assert.equal(h.result.conflict.server.answers.q1, 1);
  assert.equal(h.result.conflict.local.formState.lifeNotes, "My local copy");
  assert.equal(await h.result.flush(), null);
  conflict = false;
  await h.result.resolve("local");
  assert.equal(calls.at(-1).revision, 9);
  assert.equal(calls.at(-1).answers.q1, 5);
  assert.equal(h.result.conflict, null);
  assert.equal(JSON.parse(h.storage.get("ep_integrated_token_42")!).alternative.answers.q1, 1);
});

test("reload retains unsaved local answers and cursor when offline", async () => {
  const h = harness();
  await h.start();
  h.result.setAnswer("q1", 4);
  h.result.updateForm({ _stepIndex: 4, round: 5, profilePhotoPath: "/photo", lifeNotes: "Offline edit" });
  const reloaded = harness({ storage: h.storage, api: {
    getIntegratedAttempt: async () => { throw new Error("Network unavailable"); },
  } });
  await reloaded.tick();
  assert.equal(reloaded.result.answers.q1, 4);
  assert.equal(reloaded.result.dirty, true);
  assert.equal(reloaded.restored.at(-1).round, 5);
  assert.equal(reloaded.restored.at(-1)._stepIndex, 4);
  assert.match(reloaded.result.error, /Network unavailable/);
  assert.equal(reloaded.storage.has("ep_integrated_token_42"), true);
});

test("reload detects conflicting revisions without overwriting; server choice archives local copy", async () => {
  const h = harness();
  await h.start();
  h.result.setAnswer("q1", 5);
  h.result.updateForm({ lifeNotes: "Local" });
  const remote = { ...view(7), answers: { q1: 2 }, formState: { lifeNotes: "Server", round: 1 } };
  const reloaded = harness({ storage: h.storage, api: { getIntegratedAttempt: async () => remote } });
  await reloaded.tick();
  assert.equal(reloaded.result.answers.q1, 5);
  assert.equal(reloaded.calls.length, 0);
  await reloaded.result.resolve("server");
  assert.equal(reloaded.result.answers.q1, 2);
  assert.equal(reloaded.restored.at(-1).lifeNotes, "Server");
  assert.equal(JSON.parse(h.storage.get("ep_integrated_token_42")!).alternative.answers.q1, 5);
});

test("400 save failure blocks flush without dropping edits and can be corrected and retried", async () => {
  let fail = false;
  const h = harness({ api: { saveIntegratedAttempt: async (_c, _id, data) => {
    if (fail) throw { status: 400, data: { error: "Form progress exceeds the 48 KB limit." } };
    return { ...view(data.revision + 1), ...clone(data), revision: data.revision + 1 };
  } } });
  await h.start();
  fail = true;
  h.result.setAnswer("q1", "skip");
  assert.equal(await h.result.flush(), null);
  assert.match(h.result.error, /48 KB/);
  assert.equal(h.result.dirty, true);
  assert.equal(h.result.answers.q1, "skip");
  fail = false;
  assert.ok(await h.result.flush());
  assert.equal(h.result.error, "");
});

test("expired drafts surface an explicit error and keep the local backup until discard", async () => {
  const h = harness();
  await h.start();
  const reloaded = harness({ storage: h.storage, api: { getIntegratedAttempt: async () => { throw { status: 410 }; } } });
  await reloaded.tick();
  assert.match(reloaded.result.error, /expired/);
  assert.equal(reloaded.storage.has("ep_integrated_token_42"), true);
  reloaded.result.clear();
  assert.equal(reloaded.storage.has("ep_integrated_token_42"), false);
});

test("completed attempt reload clears credentials instead of reviving an editable draft", async () => {
  const h = harness();
  await h.start();
  const reloaded = harness({ storage: h.storage, api: {
    getIntegratedAttempt: async () => ({ ...view(2), status: "completed", profileId: 17 }),
  } });
  await reloaded.tick();
  assert.equal(reloaded.result.completed, true);
  assert.equal(reloaded.result.attempt, null);
  assert.equal(reloaded.storage.has("ep_integrated_token_42"), false);
});

test("failed resume must revalidate with the server before final flush can succeed", async () => {
  const h = harness();
  await h.start();
  let offline = true;
  const reloaded = harness({ storage: h.storage, api: {
    getIntegratedAttempt: async () => {
      if (offline) throw new Error("Offline");
      return view(1);
    },
  } });
  await reloaded.tick();
  assert.equal(await reloaded.result.flush(), null);
  assert.match(reloaded.result.error, /Offline/);
  offline = false;
  await reloaded.result.retry();
  assert.ok(await reloaded.result.flush());
  assert.equal(reloaded.result.error, "");
});

test("final-submit revision races get an explicit conflict, not an automatic overwrite", async () => {
  const h = harness();
  await h.start({ lifeNotes: "My final notes" });
  h.result.setAnswer("q1", 5);
  await h.result.flush();
  h.setServer({ ...view(8), answers: { q1: 1 }, formState: { lifeNotes: "Other tab" } });
  await h.result.refreshConflict();
  assert.equal(h.result.answers.q1, 5);
  assert.equal(h.result.conflict.local.formState.lifeNotes, "My final notes");
  assert.equal(h.result.conflict.server.answers.q1, 1);
  assert.equal(await h.result.flush(), null);
  assert.equal(JSON.parse(h.storage.get("ep_integrated_token_42")!).dirty, true);
});

test("discard invalidates in-flight responses; credentials are scoped to church", async () => {
  const first = deferred<any>();
  const h = harness({ api: { saveIntegratedAttempt: () => first.promise } });
  await h.start();
  h.result.clear();
  first.resolve(view(1));
  await h.tick();
  assert.equal(h.result.attempt, null);
  assert.equal(h.storage.has("ep_integrated_token_42"), false);
  h.storage.set("ep_integrated_token_42", JSON.stringify({ ...view(), cachedAttempt: view(), dirty: false }));
  h.switchChurch(99);
  await h.tick();
  assert.equal(h.result.attempt, null);
  assert.equal(h.storage.has("ep_integrated_token_42"), true);
  assert.equal(h.storage.has("ep_integrated_token_99"), false);
});

test("rapid start requests cannot create duplicate drafts", async () => {
  const gate = deferred<any>();
  let starts = 0;
  const h = harness({ api: { startIntegratedAttempt: async () => {
    starts++; return gate.promise;
  } } });
  await h.tick();
  const start = h.result.start;
  const options = { adultConfirmed: true, celibacyEligible: false, optionalExperienceOptIn: false };
  const first = start(options, {});
  const second = start(options, {});
  assert.equal(starts, 1);
  gate.resolve(view());
  await Promise.all([first, second]);
  await h.tick();
  assert.equal(h.result.attempt.attemptId, "draft-1");
});

test("storage quota failure is visible rather than claiming local backup succeeded", async () => {
  class FullStorage extends Map<string, string> {
    override set(): this { throw new Error("Quota exceeded"); }
  }
  const h = harness({ storage: new FullStorage() });
  await h.start();
  assert.match(h.result.storageError, /Local backup is unavailable or full/);
  h.result.setAnswer("q1", 4);
  assert.equal(h.result.answers.q1, 4);
  assert.ok(await h.result.flush());
});