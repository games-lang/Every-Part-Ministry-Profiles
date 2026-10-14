import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const setup = source("./church-setup.tsx");

test("Church tab cards follow the requested order and retain access history", () => {
  const labels = ["Basic Information</CardTitle>", "Your Assessment Link</CardTitle>", "Pastor admins", "Church Branding", "<ChurchRemovalHistory />"];
  const positions = labels.map((label) => setup.indexOf(label));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal(setup.match(/Basic Information<\/CardTitle>/g)?.length, 1);
  assert.match(setup, /Details, access, and sharing/);
  assert.match(setup, /Tradition, content, and experiences/);
});

test("under-13 setup cards and editors use the server's launch availability", () => {
  assert.match(setup, /church.under13ProfilesEnabled === true && \([\s\S]*?Discover hallway code/);
  assert.match(setup, /filter\(\(\[key\]\) => church.under13ProfilesEnabled === true \|\| \(key !== "discover" && key !== "explore"\)\)/);
  assert.match(setup, /editingYouthProfile && \(church.under13ProfilesEnabled === true \|\| editingYouthProfile === "develop"\)/);
  const gateway = source("./age-gateway.tsx");
  assert.match(gateway, /calculatedAge < 13 && church\?\.under13ProfilesEnabled !== true/);
  for (const experience of ["discover", "explore"]) {
    const gate = source(`./${experience}-gate.tsx`);
    const blocked = gate.indexOf("church?.under13ProfilesEnabled !== true");
    const opens = gate.indexOf("return <Page");
    assert.ok(blocked >= 0 && blocked < opens);
    assert.match(gate, /return <Under13Unavailable/);
    assert.match(gateway, new RegExp(`church.under13ProfilesEnabled === true && overrideLink\\("${experience}"`));
  }
});

test("dirty-only save bar submits the original form and resets its baseline only on success", () => {
  assert.match(setup, /form.formState.isDirty && \([\s\S]*?church-setup-savebar sticky bottom-4/);
  assert.match(setup, /You have unsaved changes/);
  assert.match(setup, /<form onSubmit=\{form.handleSubmit\(onSubmit\)\}/);
  assert.match(setup, /data-testid="church-setup-unsaved-bar"[\s\S]*?<Button type="submit"/);
  const submit = setup.split("const onSubmit =")[1].split("const handleAddAdmin")[0];
  assert.match(submit, /onSuccess:[\s\S]*?form.reset\(data\)/);
  assert.match(submit, /const currentValues = form.getValues\(\)/);
  assert.match(submit, /form.setValue\(key, currentValues\[key\], \{ shouldDirty: true \}\)/);
  assert.doesNotMatch(submit.split("onError:")[1], /form.reset/);
});

test("setup validation uses safe-parse inline errors and long tab subtitles can wrap", () => {
  assert.doesNotMatch(setup, /zodResolver/);
  const submit = setup.split("const onSubmit =")[1].split("const handleAddAdmin")[0];
  assert.match(submit, /churchFormSchema.safeParse\(data\)/);
  assert.match(submit, /if \(!parsed.success\)[\s\S]*?form.setError/);
  assert.ok(submit.indexOf("form.setError") < submit.indexOf("updateChurch.mutate"));
  assert.equal(setup.match(/church-setup-tab-subtitle min-w-0 whitespace-normal/g)?.length, 2);
});

test("PartFinder uses Compass at all three sizes without badge icons and retains personalization", () => {
  const assistant = source("../components/partfinder-assistant.tsx");
  for (const size of [4, 5, 6]) assert.ok(assistant.includes(`<Compass className="h-${size} w-${size}" />`));
  assert.doesNotMatch(assistant, /\b(?:Puzzle|Bot|Search|Sparkles)\b/);
  assert.match(assistant, /Personalized by your My Leadership profile/);
  assert.match(assistant, /Personalization paused/);
});
