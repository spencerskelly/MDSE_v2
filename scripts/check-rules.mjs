#!/usr/bin/env node
// Validates governance/RULESET.md and keeps governance/register/rules-register.csv in step with it.
//   node scripts/check-rules.mjs          check format and that the CSV is current (CI)
//   node scripts/check-rules.mjs --write  regenerate the CSV after editing RULESET.md
// RULESET.md is the source of truth (GOV-004). The CSV is a generated view for filtering in a spreadsheet.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RULESET = path.join(root, "governance/RULESET.md");
const CSV = path.join(root, "governance/register/rules-register.csv");
const STATUS = new Set(["Active", "Proposed", "Check", "Unreviewed"]);
const PHASE = new Set(["Standing", "P1", "P2", "P3", "Later"]);
const SECTIONS = new Set(["GOV", "DAT", "MOD", "IMP", "BOM", "BAS", "BOO", "WKB", "AIP", "TST"]);
const HEAD = /^- \*\*([A-Z]{3})-(\d{3})\*\* · (\S+) · (\S+)(?: · (live))? — (.*)$/;

// Split "rule text (origin) *Note: ...*" from the right, honouring nested parentheses in the origin.
function splitTail(rest) {
  let note = "";
  const n = rest.match(/ \*Note: (.*)\*$/);
  if (n) { note = n[1]; rest = rest.slice(0, n.index); }
  if (!rest.endsWith(")")) return null;
  let depth = 0;
  for (let i = rest.length - 1; i >= 0; i--) {
    if (rest[i] === ")") depth++;
    else if (rest[i] === "(" && --depth === 0) return { text: rest.slice(0, i).trim(), origin: rest.slice(i + 1, -1), note };
  }
  return null;
}

const errors = [], rules = [], seen = new Set();
let section = null, subsection = "", inRetired = false;
fs.readFileSync(RULESET, "utf8").split("\n").forEach((line, i) => {
  const at = `RULESET.md:${i + 1}`;
  const h2 = line.match(/^## ([A-Z]{3}) — /);
  if (line.startsWith("## ")) { section = h2 ? h2[1] : null; inRetired = line === "## Retired rules"; subsection = ""; }
  if (h2 && !SECTIONS.has(h2[1])) errors.push(`${at}: unknown section ${h2[1]}`);
  if (line.startsWith("### ")) subsection = line.slice(4).trim();
  if (inRetired || !section || !line.startsWith("- **")) return;
  const m = line.match(HEAD);
  if (!m) { errors.push(`${at}: rule line does not match "- **XXX-NNN** · Status · Phase [· live] — text (origin)"`); return; }
  const [, sec, num, status, phase, live, rest] = m, id = `${sec}-${num}`;
  if (sec !== section) errors.push(`${at}: ${id} sits under section ${section}`);
  if (seen.has(id)) errors.push(`${at}: duplicate id ${id}`);
  seen.add(id);
  if (!STATUS.has(status)) errors.push(`${at}: ${id} has unknown status "${status}"`);
  if (!PHASE.has(phase)) errors.push(`${at}: ${id} has unknown phase "${phase}"`);
  const tail = splitTail(rest);
  if (!tail || !tail.origin.trim()) { errors.push(`${at}: ${id} has no origin in parentheses at the end`); return; }
  rules.push({ id, section: sec, subsection, status, phase, live: live ? "live" : "", text: tail.text, origin: tail.origin, note: tail.note });
});

const q = (s) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
const csv = ["ID,Section,Subsection,Status,Phase,Live,Rule,Origin,Note", ...rules.map((r) =>
  [r.id, r.section, r.subsection, r.status, r.phase, r.live, r.text, r.origin, r.note].map(q).join(","))].join("\n") + "\n";

if (process.argv.includes("--write")) fs.writeFileSync(CSV, csv);
else if (!fs.existsSync(CSV) || fs.readFileSync(CSV, "utf8") !== csv)
  errors.push("governance/register/rules-register.csv is out of date: run `npm run rules:write`");

const count = (k) => [...rules.reduce((m, r) => m.set(r[k], (m.get(r[k]) || 0) + 1), new Map())].map(([a, b]) => `${a} ${b}`).join(", ");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`${rules.length} rules OK (${rules.filter((r) => r.live).length} tagged live). Status: ${count("status")}. Phase: ${count("phase")}.`);
