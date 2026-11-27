#!/usr/bin/env node
/* One-command version bump (docs/VERSIONING.md).
 *
 *   npm run bump -- patch "What changed, in one line"      (or minor)
 *   options: --base <ref> (default origin/main)  --dry-run  --no-build
 *
 * Finds the components whose source changed since the base (committed, staged, unstaged or new files), raises each one
 * that has not already moved past the base version, adds the Importer history entry and a CHANGELOG entry under
 * "## Unreleased", then rebuilds the paired outputs (npm run build). Run it again after more changes: a component that
 * is already ahead of the base is left alone, and the history and changelog entries are updated, not repeated. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { components } from "./components.mjs";

const root = process.env.MDSE_BUMP_ROOT ?? fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2), flag = (f) => args.includes(f), opt = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const level = args[0], summary = args[1];
if (!["patch", "minor"].includes(level) || !summary || summary.startsWith("--")) {
  console.error('Usage: npm run bump -- <patch|minor> "summary of the change" [--base origin/main] [--dry-run] [--no-build]'); process.exit(2);
}
const base = opt("--base", "origin/main"), dry = flag("--dry-run");
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const at = (p) => `${root}/${p}`;
const readJson = (p) => JSON.parse(readFileSync(at(p), "utf8"));
const parse = (v) => v.split("-")[0].split(".").map(Number);
const gt = (a, b) => { const x = parse(a), y = parse(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
const inc = (v) => { const [M, m, p] = parse(v); return level === "minor" ? `${M}.${m + 1}.0` : `${M}.${m}.${p + 1}`; };

let mergeBase;
try { mergeBase = git("merge-base", base, "HEAD"); } catch { console.error(`Cannot find the base ${base}. Fetch it or pass --base.`); process.exit(2); }
const changed = new Set([...git("diff", "--name-only", mergeBase).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean));
const baseVersion = (c) => { try { return JSON.parse(git("show", `${mergeBase}:${c.path}`)).version; } catch { return null; } };

const d0 = new Date(), date = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, "0")}-${String(d0.getDate()).padStart(2, "0")}`, plan = [];   // local date
for (const c of components) {
  if (c.optional && !existsSync(at(c.path))) continue;
  const hits = [...changed].filter((p) => c.triggers.some((t) => p === t || p.startsWith(t)));
  if (!hits.length) continue;
  const now = readJson(c.path).version, was = baseVersion(c);
  if (was === null) { plan.push({ c, from: now, to: now, note: "new component, left as is" }); continue; }
  if (gt(now, was)) { plan.push({ c, from: now, to: now, note: `already ahead of ${was}` }); continue; }
  plan.push({ c, from: now, to: inc(was), note: `${hits.length} changed path${hits.length === 1 ? "" : "s"}, first ${hits[0]}` });
}
if (!plan.length) { console.log("No shipped source changed since " + base + ": nothing to bump."); process.exit(0); }
for (const p of plan) console.log(`${p.c.label.padEnd(10)} ${p.from} -> ${p.to}  (${p.note})`);
if (dry) process.exit(0);

for (const p of plan) {
  if (p.from === p.to) continue;
  const text = readFileSync(at(p.c.path), "utf8");
  writeFileSync(at(p.c.path), text.replace(/"version":\s*"[^"]+"/, `"version": "${p.to}"`));
}
const imp = plan.find((p) => p.c.label === "Importer");
if (imp) {
  const v = readJson("tools/importer/version.json"), entry = { version: v.version, date, status: "candidate", summary };
  if (v.history[0]?.version === v.version) v.history[0] = { ...v.history[0], date, summary }; else v.history.unshift(entry);
  writeFileSync(at("tools/importer/version.json"), JSON.stringify(v, null, 2) + "\n");
}
const toolset = readJson("package.json").version, cl = readFileSync(at("CHANGELOG.md"), "utf8");
const head = `### Candidate toolset ${toolset} — `;
const parts = plan.filter((p) => p.c.label !== "Toolset" && p.c.label !== "Importer").map((p) => `${p.c.label} ${readJson(p.c.path).version}`);
const line = `- **${[...parts, `Importer and toolset ${toolset}`].join(" / ")}:** ${summary}`;
let out;
if (cl.includes(head)) {
  const i = cl.indexOf(head), j = cl.indexOf("\n### ", i + 1);
  const block = cl.slice(i, j < 0 ? undefined : j);
  out = block.includes(summary) ? cl : cl.slice(0, i) + block.replace(/\n*$/, "\n") + line + "\n\n" + (j < 0 ? "" : cl.slice(j + 1));
} else {
  const u = cl.indexOf("## Unreleased");
  if (u < 0) { console.error("CHANGELOG.md has no '## Unreleased' heading."); process.exit(1); }
  const after = cl.indexOf("\n", u) + 1;
  const title = summary.split(/[;:]/)[0].replace(/\.$/, "").trim(), short = title.length > 90 ? title.slice(0, 87).replace(/\s+\S*$/, "") + "…" : title;
  out = cl.slice(0, after) + `\n${head}${short} (${date})\n\n${line}\n- **Release status:** internal candidate; not deployed.\n` + cl.slice(after);
}
writeFileSync(at("CHANGELOG.md"), out);
console.log("Updated versions, Importer history and CHANGELOG.md.");
if (!flag("--no-build")) { execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" }); console.log("Rebuilt the paired outputs. Next: npm test, then commit."); }
