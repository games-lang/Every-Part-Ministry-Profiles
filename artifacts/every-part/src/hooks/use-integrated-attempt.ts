import { useCallback, useEffect, useRef, useState } from "react";
import {
  getIntegratedAttempt,
  saveIntegratedAttempt,
  startIntegratedAttempt,
  type AssessmentConfiguration,
  type IntegratedAnswers,
  type IntegratedAttemptStartInput,
  type IntegratedAttemptView,
  type MinistryCustomization,
} from "@workspace/api-client-react";

export type DraftForm = Record<string, unknown>;
export type Attempt = Omit<IntegratedAttemptView, "snapshot"> & {
  token: string;
  snapshot: {
    assessmentConfiguration: AssessmentConfiguration;
    ministryCustomization: MinistryCustomization;
    enabledSpiritualGifts: string[];
    [key: string]: unknown;
  };
};
type Progress = { answers: IntegratedAnswers; formState: DraftForm };
type Backup = Progress & {
  attemptId: string;
  token: string;
  revision: number;
  dirty: boolean;
  cachedAttempt?: Attempt;
  alternative?: Progress;
};
export type DraftConflict = { server: Attempt; local: Progress };
const storageKey = (churchId: number) => `ep_integrated_token_${churchId}`;
const MAX_BACKUP_BYTES = 240_000;

// Only bounded, non-assessment wizard fields go to the draft API.
const FORM_KEYS = new Set([
  "step", "currentStep", "round", "questionIndex", "profileType", "age", "birthdate",
  "basicInformation", "churchConnection", "skills", "passions", "interests", "availability",
  "servingFrequency", "languages", "churchDetails", "skillsDetails", "lifeExperiences",
  "availabilityDetails", "ministryPreferences", "spiritualHealth", "profilePhotoPath",
  "inviteToken", "_stepIndex", "languageEntries", "occupation", "lifeSelected", "lifeNotes",
  "preferences", "strengthNotes",
]);
export function draftFormState(value: DraftForm): DraftForm {
  return JSON.parse(JSON.stringify(Object.fromEntries(
    Object.entries(value).filter(([key]) => FORM_KEYS.has(key)),
  )));
}
function message(error: unknown): string {
  const e = error as { data?: { error?: string }; message?: string; status?: number };
  if (e?.status === 410) return "This draft has expired. Your local answers remain here; discard the draft explicitly to start again.";
  return e?.data?.error || e?.message || "Could not reach the server. Your local progress has been retained. Please retry.";
}
function withToken(view: IntegratedAttemptView, token: string): Attempt {
  return { ...view, token } as Attempt;
}

/**
 * Owns credentials, immediate local backup and a single-flight save queue.
 * A response can advance the revision, but never replace newer local edits.
 */
export function useIntegratedAttempt(churchId: number | undefined, onRestore: (state: DraftForm) => void) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<IntegratedAnswers>({});
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [conflict, setConflict] = useState<DraftConflict | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [completed, setCompleted] = useState(false);
  const restore = useRef(onRestore);
  restore.current = onRestore;
  const state = useRef<{
    attempt: Attempt | null; answers: IntegratedAnswers; formState: DraftForm;
    dirty: boolean; edit: number; epoch: number; conflict: DraftConflict | null;
    alternative?: Progress;
  }>({ attempt: null, answers: {}, formState: {}, dirty: false, edit: 0, epoch: 0, conflict: null });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flight = useRef<Promise<Attempt | null> | null>(null);
  const loadingRef = useRef(false);
  const startingRef = useRef(false);
  const needsLoad = useRef(false);
  const flushRef = useRef<() => Promise<Attempt | null>>(async () => null);

  const persist = useCallback(() => {
    const s = state.current;
    if (!churchId || !s.attempt) return;
    const backup: Backup = {
      attemptId: s.attempt.attemptId, token: s.attempt.token, revision: s.attempt.revision,
      answers: s.answers, formState: s.formState, dirty: s.dirty,
      cachedAttempt: { ...s.attempt, answers: {}, formState: {} },
      alternative: s.alternative,
    };
    try {
      const raw = JSON.stringify(backup);
      if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error("The local draft is too large.");
      localStorage.setItem(storageKey(churchId), raw);
      setStorageError("");
    } catch {
      setStorageError("Local backup is unavailable or full. Keep this page open until your progress is saved to the server.");
    }
  }, [churchId]);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    state.current = { attempt: null, answers: {}, formState: {}, dirty: false, edit: 0, epoch: state.current.epoch + 1, conflict: null };
    flight.current = null;
    loadingRef.current = false;
    startingRef.current = false;
    needsLoad.current = false;
    if (churchId) {
      try { localStorage.removeItem(storageKey(churchId)); }
      catch { setStorageError("Could not remove the local draft. Clear this site's saved data before using a shared device."); }
    }
    setAttempt(null); setAnswers({}); setHasDraft(false); setConflict(null);
    setDirty(false); setError(""); setSaving(false); setLoading(false); setStarting(false);
  }, [churchId]);

  const apply = useCallback((view: Attempt, progress: Progress, isDirty: boolean) => {
    Object.assign(state.current, { attempt: view, ...progress, dirty: isDirty });
    setAttempt(view); setAnswers(progress.answers); setDirty(isDirty); setHasDraft(true);
    restore.current(progress.formState);
  }, []);

  const load = useCallback(async () => {
    if (!churchId) return;
    const epoch = ++state.current.epoch;
    loadingRef.current = true;
    needsLoad.current = true;
    setLoading(true); setError("");
    try {
      const raw = localStorage.getItem(storageKey(churchId));
      if (!raw) { needsLoad.current = false; return; }
      if (raw.length > MAX_BACKUP_BYTES) throw new Error("Stored draft is too large. Discard it explicitly to start again.");
      setHasDraft(true);
      const backup = JSON.parse(raw) as Backup;
      if (!backup.attemptId || !backup.token) throw new Error("Stored draft credentials are invalid. Discard the draft explicitly to start again.");
      const local: Progress = { answers: backup.answers ?? {}, formState: backup.formState ?? {} };
      if (backup.cachedAttempt?.attemptId === backup.attemptId) {
        apply(withToken(backup.cachedAttempt, backup.token), local, backup.dirty);
        state.current.alternative = backup.alternative;
      }
      const remote = withToken(await getIntegratedAttempt(churchId, backup.attemptId, {
        headers: { Authorization: `Bearer ${backup.token}` },
      }), backup.token);
      if (epoch !== state.current.epoch) return;
      needsLoad.current = false;
      if (remote.status === "completed") {
        clear(); setCompleted(true); return;
      }
      if (backup.dirty && backup.revision !== remote.revision) {
        // Leave every local edit in place. The user, not GET, selects the winner.
        if (!state.current.attempt) apply(remote, local, true);
        const next = { server: remote, local };
        state.current.conflict = next; setConflict(next);
        setError("The server has a different revision. Review both copies before choosing which to save.");
      } else {
        apply(remote, backup.dirty ? local : { answers: remote.answers, formState: remote.formState }, !!backup.dirty);
        persist();
        if (backup.dirty) timer.current = setTimeout(() => void flushRef.current(), 800);
      }
    } catch (e) {
      if (epoch === state.current.epoch) setError(message(e));
    } finally {
      if (epoch === state.current.epoch) { loadingRef.current = false; setLoading(false); }
    }
  }, [churchId, apply, clear, persist]);

  useEffect(() => {
    state.current = { attempt: null, answers: {}, formState: {}, dirty: false, edit: 0, epoch: state.current.epoch + 1, conflict: null };
    setAttempt(null); setAnswers({}); setHasDraft(false); setConflict(null); setCompleted(false);
    setDirty(false); setSaving(false); setStarting(false); setStorageError("");
    startingRef.current = false;
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      state.current.epoch++;
      flight.current = null;
    };
  }, [load]);

  const flush = useCallback(async (): Promise<Attempt | null> => {
    if (timer.current) clearTimeout(timer.current);
    if (flight.current) return flight.current;
    if (!churchId || loadingRef.current || needsLoad.current || !state.current.attempt || state.current.conflict) return null;
    const epoch = state.current.epoch;
    const run = async () => {
      if (epoch !== state.current.epoch) return null;
      setSaving(true); setError("");
      try {
        while (state.current.dirty) {
          const s = state.current;
          const current = s.attempt!;
          const edit = s.edit;
          const sent = { answers: s.answers, formState: s.formState };
          try {
            const result = withToken(await saveIntegratedAttempt(churchId, current.attemptId, {
              revision: current.revision, ...sent,
            }, { headers: { Authorization: `Bearer ${current.token}` } }), current.token);
            if (state.current.epoch !== epoch) return null;
            state.current.attempt = result;
            state.current.dirty = state.current.edit !== edit;
            setAttempt(result); setDirty(state.current.dirty); persist();
          } catch (e) {
            if (state.current.epoch !== epoch) return null;
            if ((e as { status?: number }).status === 409) {
              // Fetch only for comparison; do NOT reset answers/form or retry implicitly.
              const remote = withToken(await getIntegratedAttempt(churchId, current.attemptId, {
                headers: { Authorization: `Bearer ${current.token}` },
              }), current.token);
              if (state.current.epoch !== epoch) return null;
              const next = { server: remote, local: { answers: state.current.answers, formState: state.current.formState } };
              state.current.conflict = next; setConflict(next); persist();
              throw new Error("Another save changed this draft. Your edits are safe. Review both copies below.");
            }
            throw e;
          }
        }
        return state.current.attempt;
      } catch (e) {
        if (state.current.epoch === epoch) setError(message(e));
        return null;
      } finally {
        if (state.current.epoch === epoch) { setSaving(false); flight.current = null; }
      }
    };
    // The microtask also makes the no-dirty path release the flight correctly.
    flight.current = Promise.resolve().then(run);
    return flight.current;
  }, [churchId, persist]);
  flushRef.current = flush;

  const update = useCallback((progress: Partial<Progress>) => {
    const s = state.current;
    if (loadingRef.current || !s.attempt || s.attempt.status !== "draft") return;
    const next = { answers: progress.answers ?? s.answers, formState: progress.formState ? draftFormState(progress.formState) : s.formState };
    if (JSON.stringify(next) === JSON.stringify({ answers: s.answers, formState: s.formState })) return;
    Object.assign(s, next, { dirty: true, edit: s.edit + 1 });
    if (s.conflict) {
      s.conflict = { ...s.conflict, local: next };
      setConflict(s.conflict);
    }
    setAnswers(next.answers); setDirty(true); persist();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), 800);
  }, [persist]);

  const start = useCallback(async (options: IntegratedAttemptStartInput, formState: DraftForm) => {
    if (!churchId || state.current.attempt || startingRef.current || hasDraft) return;
    startingRef.current = true;
    const epoch = state.current.epoch;
    setStarting(true); setError(""); setCompleted(false);
    try {
      const view = await startIntegratedAttempt(churchId, options);
      if (state.current.epoch !== epoch) return;
      if (!view.token) throw new Error("The server did not return draft credentials. Please contact your church.");
      const current = withToken(view, view.token);
      needsLoad.current = false;
      // Retain information entered before opting in rather than resetting it.
      apply(current, { answers: view.answers, formState: draftFormState(formState) }, true);
      persist();
      void flushRef.current();
    } catch (e) { if (state.current.epoch === epoch) setError(message(e)); }
    finally { if (state.current.epoch === epoch) { startingRef.current = false; setStarting(false); } }
  }, [churchId, starting, hasDraft, apply, persist]);

  const resolve = useCallback(async (choice: "local" | "server") => {
    const s = state.current;
    if (!s.conflict) return;
    const remote = s.conflict.server;
    if (remote.status === "completed") { clear(); setCompleted(true); return; }
    // Keep the non-selected copy in the bounded backup until this attempt ends.
    const local = { answers: s.answers, formState: s.formState };
    const server = { answers: remote.answers, formState: remote.formState };
    s.alternative = choice === "local" ? server : local;
    s.conflict = null; setConflict(null); setError("");
    s.edit++;
    apply(remote, choice === "local" ? local : server, choice === "local");
    persist();
    if (choice === "local") await flush();
  }, [apply, persist, flush, clear]);

  // A final POST can race with another tab even after our PATCH succeeded.
  // Treat that 409 just like a save conflict, retaining the submitted local copy.
  const refreshConflict = useCallback(async () => {
    const s = state.current;
    if (!churchId || !s.attempt) return;
    const epoch = s.epoch;
    needsLoad.current = true;
    s.dirty = true; s.edit++; setDirty(true); persist();
    try {
      const server = withToken(await getIntegratedAttempt(churchId, s.attempt.attemptId, {
        headers: { Authorization: `Bearer ${s.attempt.token}` },
      }), s.attempt.token);
      if (state.current.epoch !== epoch) return;
      needsLoad.current = false;
      const next = { server, local: { answers: s.answers, formState: s.formState } };
      s.conflict = next; setConflict(next);
      setError("Submission found another saved revision. Your local copy is unchanged; compare both copies before retrying.");
    } catch (e) {
      if (state.current.epoch === epoch) setError(message(e));
    }
  }, [churchId, persist]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (state.current.dirty) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return {
    attempt, answers, loading, starting, saving, dirty, error, storageError, conflict, hasDraft, completed,
    start, flush, load, resolve, clear, refreshConflict,
    retry: () => needsLoad.current ? load() : flush(),
    updateForm: (formState: DraftForm) => update({ formState }),
    setAnswer: (id: string, value: IntegratedAnswers[string]) => update({ answers: { ...state.current.answers, [id]: value } }),
  };
}