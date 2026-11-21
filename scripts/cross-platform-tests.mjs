/** Test entrypoint that avoids shell glob expansion differences across Windows, macOS and Linux. */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const groups = ["tools/importer/test", "tools/workbench/test", "tools/core/test", "tools/bootstrap/test"];
for (const dir of groups) {
  const files = readdirSync(resolve(dir)).filter((x) => x.endsWith(".test.ts") || x.endsWith(".test.mjs")).sort()
    .map((x) => resolve(dir, x));
  if (!files.length) throw new Error("No tests found in " + dir);
  console.log("Running " + files.length + " test files from " + dir);
  const p = spawnSync(process.execPath, ["--no-warnings", "--test", ...files], { stdio: "inherit" });
  if (p.error) throw p.error;
  if (p.status !== 0) process.exit(p.status ?? 1);
}
