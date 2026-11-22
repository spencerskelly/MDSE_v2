#!/usr/bin/env node
/* Ensure shipped tool implementation changes always increase the visible semantic versions.
 * Local: node scripts/check-versions.mjs
 * CI:    node scripts/check-versions.mjs --base <commit-ish>
 * Pure version comparison; no mutations, tags or release approvals.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const root = process.env.MDSE_VERSION_TEST_ROOT
  ? pathToFileURL(resolve(process.env.MDSE_VERSION_TEST_ROOT) + "/")
  : new URL("../", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), "utf8")).version;
const semver = (s) => {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(s ?? "")) throw Error("Invalid semantic version: " + s);
  return s.split("-")[0].split(".").map(Number);
};
const cmp = (a,b) => {
  const x = semver(a), y = semver(b);
  for (let i=0;i<3;i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  if (a === b) return 0;
  return a.includes("-") ? -1 : 1;
};
const components = [
  { label:"Importer", path:"tools/importer/version.json", triggers:["tools/importer/src/","tools/importer/build.mjs","tools/core/src/","governance/schemas/"] },
  { label:"Workbench", path:"tools/workbench/manifest.json", triggers:["tools/workbench/src/","tools/workbench/build.mjs"] },
  { label:"Bootstrap", path:"tools/bootstrap/manifest.json", triggers:["tools/bootstrap/src/"] },
  { label:"Toolset", path:"package.json", triggers:["tools/importer/src/","tools/importer/build.mjs","tools/importer/version.json","tools/workbench/src/","tools/workbench/build.mjs","tools/workbench/manifest.json","tools/bootstrap/src/","tools/bootstrap/manifest.json","tools/base-vault/src/","tools/base-vault/vendor/","tools/core/src/","governance/schemas/"] }
];
const run = (...args) => execFileSync("git",args,{cwd:new URL(".",root),encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
let errors = 0;
for (const c of components) { try { semver(read(c.path)); } catch (e) { console.error(c.label+": "+e.message);errors++; } }
const at = process.argv.indexOf("--base");
if (at >= 0) {
  const candidate = process.argv[at+1];
  if (!candidate || !/^[A-Za-z0-9_.\/-]+$/.test(candidate) || /^0+$/.test(candidate)) {
    console.error("--base requires a valid existing Git ref");process.exit(2);
  }
  let base, changed;
  try {
    base = run("merge-base",candidate,"HEAD");
    changed = run("diff","--name-only",base,"HEAD").split("\n").filter(Boolean);
  } catch(e) { console.error("Cannot compare against base: "+e.message);process.exit(2); }
  for (const c of components) {
    const active = changed.filter(p => c.triggers.some(x => p === x || p.startsWith(x)));
    let old;
    try {
      const raw = execFileSync("git",["show",base+":"+c.path],{cwd:new URL(".",root),encoding:"utf8"});
      old = JSON.parse(raw).version;
    } catch (_) {
      // Before importer/version.json existed, Importer version came from package.json.
      if(c.label==="Importer") {
        try { old = JSON.parse(execFileSync("git",["show",base+":package.json"],{cwd:new URL(".",root),encoding:"utf8"})).version; } catch (_) {}
      }
    }
    const now = read(c.path);
    if (!old) { console.error(c.label+": no baseline version at "+base);errors++;continue; }
    if (cmp(now,old)<0) { console.error(c.label+": version decreased from "+old+" to "+now);errors++;continue; }
    if (active.length && cmp(now,old) <= 0) {
      console.error(c.label+": "+active.length+" shipped source path(s) changed without version increment ("+old+" -> "+now+"). First: "+active[0]);errors++;
    } else console.log(c.label+": "+old+" -> "+now+(active.length?" ("+active.length+" changed source paths)":" (no implementation change)"));
  }
}
if (errors) process.exit(1);
console.log("Version metadata and required increments: OK");
