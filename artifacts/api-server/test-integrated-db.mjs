import { build } from "esbuild";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production") {
  throw new Error("Integrated database contract tests must only run against development.");
}
const root = dirname(fileURLToPath(import.meta.url));
const directory = await mkdtemp(join(root, ".integrated-test-"));
try {
  const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const external = Object.keys(manifest.dependencies).filter(name => !name.startsWith("@workspace/"));
  const output = join(directory, "integrated-attempts.test.cjs");
  const removalOutput = join(directory, "church-removal-db.test.cjs");
  // Bundle workspace TS imports (which use bundler-style extension resolution)
  // while retaining normal Node package resolution for runtime dependencies.
  await build({
    absWorkingDir: root,
    entryPoints: ["src/lib/integrated-attempts.test.ts"],
    bundle: true, platform: "node", format: "cjs",
    external: [...external, "pg-native"], outfile: output,
  });
  await build({
    absWorkingDir: root,
    entryPoints: ["src/lib/church-removal-db.test.ts"],
    bundle: true, platform: "node", format: "cjs",
    external: [...external, "pg-native"], outfile: removalOutput,
  });
  const result = spawnSync(process.execPath, ["--test", output, removalOutput], {
    cwd: root, stdio: "inherit", env: { ...process.env, RUN_INTEGRATED_DB_TESTS: "1" },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}