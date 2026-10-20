#!/usr/bin/env node
// Builds the SysML v2 language notes (one per element and relationship) from governance/language/catalog.json.
//   node scripts/build-language.mjs          check that the notes are current (CI)
//   node scripts/build-language.mjs --write  regenerate governance/language/sysml-v2/*.md
// catalog.json is the source (D-0028). "Written by the importer" is measured, not claimed: the importer runs on the synthetic
// EA model and the Workbench scanner reports which constructs appear in the SysML it wrote.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "governance/language");
const out = path.join(dir, "sysml-v2");
const catalog = JSON.parse(fs.readFileSync(path.join(dir, "catalog.json"), "utf8"));
const byId = new Map(catalog.map((c) => [c.id, c]));

// ---- what the importer writes: run it on the synthetic model and classify every SysML block
const { buildSyntheticQeax } = await import(path.join(root, "testing/fixtures/synthetic-ea/make_qeax.mjs"));
const { runImport } = await import(path.join(root, "tools/importer/src/run.ts"));
const { sqliteReader, defaultOptions } = await import(path.join(root, "tools/importer/test/harness.ts"));
const { scanSysml } = await import(path.join(root, "tools/workbench/src/sysml_scan.ts"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mdse-lang-"));
const q = path.join(tmp, "syn.qeax"); buildSyntheticQeax(q);
const reader = sqliteReader(q);
const emitted = new Set();
try {
  const res = await runImport(reader, defaultOptions());
  for (const f of res.files) {
    if (!f.path.endsWith(".md") || f.path.startsWith("99_System/") || f.path === "README.md") continue;
    const m = /```sysml\n([\s\S]*?)```/.exec(f.content);
    if (m) for (const i of scanSysml(m[1]).langs) emitted.add(i);
  }
} finally { reader.close(); fs.rmSync(tmp, { recursive: true, force: true }); }

// Constructs the Workbench turns into a relationship or a view (tools/workbench/src/index.ts, views.ts)
const DRAWN = new Set(["specialization", "feature-typing", "part-usage", "port-usage", "action-usage", "state-usage", "item-usage", "satisfy-requirement-usage", "verify-requirement-usage", "perform-action-usage", "include-use-case-usage", "use-case-usage", "allocation-usage", "dependency", "succession", "transition-usage", "connection-usage"]);

const TIER = { core: "Everyday", common: "Common", occasional: "Occasional", rare: "Rare" };
const KIND = { definition: "Definition", usage: "Usage", relationship: "Relationship", statement: "Statement", structure: "Structure", annotation: "Annotation" };
const link = (id) => `[[${byId.get(id).name}]]`;
const q2 = (s) => JSON.stringify(s);
const labels = (k) => (k === "definition" || k === "usage" || k === "structure" || k === "annotation") ? ["Can be declared in", "Can specialize, be typed by, or refer to"] : ["Eligible from (source)", "Eligible to (target)"];

function note(c) {
  const [lf, lt] = labels(c.kind);
  const importer = emitted.has(c.id) ? "Yes. The importer writes it (seen in its output on the synthetic model)." : "No. The importer does not write it; engineers add it by hand or a later import step will.";
  const wb = DRAWN.has(c.id) ? "Recognized, and drawn: it becomes a relationship or view in the Workbench." : "Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.";
  return `---
type: Language Element
id: ${c.id}
kind: ${c.kind}
keyword: ${q2(c.keyword)}
metaclass: ${c.metaclass}
usage: ${c.tier}
status: Draft
---
# ${c.name}

**${KIND[c.kind]}** · **${TIER[c.tier]}** · \`${c.keyword}\` · SysML v2 metaclass \`${c.metaclass}\`

${c.description}

## ${lf}

${c.from.map((x) => `- ${x}`).join("\n")}

## ${lt}

${c.to.map((x) => `- ${x}`).join("\n")}

## What separates it from ${link(c.similar)}

${c.difference}

## Example

\`\`\`sysml
${c.example}
\`\`\`

## In MDSE

- **Importer:** ${importer}
- **Workbench:** ${wb}
- **Everyday use:** ${TIER[c.tier]}.
`;
}

function index() {
  const group = (tiers) => catalog.filter((c) => tiers.includes(c.tier));
  const rows = (cs) => `| Construct | Kind | Written as | Use |\n|---|---|---|---|\n${cs.map((c) => `| [[${c.name}]] | ${KIND[c.kind]} | \`${c.keyword.replace(/\|/g, "\\|")}\` | ${c.description.split(/(?<=\.)\s/)[0].replace(/\|/g, "\\|")} |`).join("\n")}`;
  return `---
type: Language Index
id: sysml-v2-language
status: Draft
---
# SysML v2 language in MDSE

${catalog.length} constructs, one note each: what it is, which elements it can come from and go to, and what separates it from the most similar construct. Source: the OMG SysML v2 specification; keywords and forms checked against the Pilot Implementation grammar (\`SysML.xtext\`).

Every construct is available. Engineers use a handful of them most of the time, so the notes carry a use level: **Everyday** (${group(["core"]).length}), **Common** (${group(["common"]).length}), **Occasional** (${group(["occasional"]).length}), **Rare** (${group(["rare"]).length}).

## Everyday

${rows(group(["core"]))}

## Common

${rows(group(["common"]))}

## Occasional

${rows(group(["occasional"]))}

## Rare

${rows(group(["rare"]))}

## How MDSE uses these notes

- The \`## SysML v2\` block of a note is authoritative (D-0003). These notes define the language that block is written in; they are not model notes and the Workbench index skips \`99_System\`.
- The Workbench scanner recognizes every construct listed here; a statement it does not recognize is reported, not dropped. Which constructs become relationships is stated in each note.
- Add or correct a construct in \`governance/language/catalog.json\` and run \`node scripts/build-language.mjs --write\`.
`;
}

const files = new Map();
const used = new Set();
for (const c of catalog) {
  const file = c.name.replace(/[\\/:*?"<>|]/g, "-") + ".md";
  if (used.has(file.toLowerCase())) throw new Error(`duplicate note name ${c.name}`);
  used.add(file.toLowerCase());
  files.set(file, note(c));
}
files.set("SysML v2 Language.md", index());

if (process.argv.includes("--write")) {
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (const [f, t] of files) fs.writeFileSync(path.join(out, f), t);
  console.log(`wrote ${files.size} notes to governance/language/sysml-v2 (${emitted.size} constructs written by the importer)`);
} else {
  const have = fs.existsSync(out) ? new Set(fs.readdirSync(out)) : new Set();
  const bad = [...files.keys()].filter((f) => !have.has(f) || fs.readFileSync(path.join(out, f), "utf8") !== files.get(f)).concat([...have].filter((f) => !files.has(f)));
  if (bad.length) { console.error(`language notes out of date (${bad.length}): ${bad.slice(0, 5).join(", ")}. Run: node scripts/build-language.mjs --write`); process.exit(1); }
  console.log(`language notes current (${files.size})`);
}
