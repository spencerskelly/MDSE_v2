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
const DRAWN = new Set(["specialization", "feature-typing", "part-usage", "port-usage", "action-usage", "state-usage", "item-usage", "satisfy-requirement-usage", "verify-requirement-usage", "perform-action-usage", "include-use-case-usage", "use-case-usage", "allocation-usage", "dependency", "succession", "conditional-succession", "transition-usage", "connection-usage"]);

const TIER = { core: "Everyday", common: "Common", occasional: "Occasional", rare: "Rare" };
const CATEGORY = { language: "Language construct", library: "Standard library concept", pattern: "Modeling pattern" };
const KIND = { definition: "Definition", usage: "Usage", relationship: "Relationship", statement: "Statement", structure: "Structure", annotation: "Annotation" };
const link = (id) => `[[${byId.get(id).name}]]`;
const q2 = (s) => JSON.stringify(s);
const labels = (k) => (k === "definition" || k === "usage" || k === "structure" || k === "annotation") ? ["Can be declared in", "Can specialize, be typed by, or refer to"] : ["Eligible from (source)", "Eligible to (target)"];

function note(c) {
  const [lf, lt] = labels(c.kind);
  const importer = emitted.has(c.id) ? "Yes. The importer writes it (seen in its output on the synthetic model)." : "No. The importer does not write it; engineers add it by hand or a later import step will.";
  const wb = DRAWN.has(c.id) ? "Recognized, and drawn: it becomes a relationship or view in the Workbench." : "Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.";
  const origin = c.category === "library" ? `SysML v2 standard library (${c.library}), not a language keyword` : c.category === "pattern" ? "Modeling pattern built from language constructs, not a construct of its own" : `SysML v2 metaclass \`${c.metaclass}\``;
  return `---
type: Language Element
id: ${c.id}
category: ${c.category}
kind: ${c.kind}
keyword: ${q2(c.keyword)}
metaclass: ${q2(c.metaclass)}${c.library ? `\nlibrary: ${q2(c.library)}` : ""}
usage: ${c.tier}
status: Draft
---
# ${c.name}

**${CATEGORY[c.category]}** · **${KIND[c.kind]}** · **${TIER[c.tier]}** · \`${c.keyword}\` · ${origin}${c.category === "library" ? `. Metaclass: \`${c.metaclass}\`` : ""}

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** ${importer}
- **Modeled in the Workbench:** ${wb}
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
`;
}

function index() {
  const lang = catalog.filter((c) => c.category === "language"), lib = catalog.filter((c) => c.category === "library"), pat = catalog.filter((c) => c.category === "pattern");
  const group = (tiers) => lang.filter((c) => tiers.includes(c.tier));
  const rows = (cs) => `| Construct | Kind | Written as | Use |\n|---|---|---|---|\n${cs.map((c) => `| [[${c.name}]] | ${KIND[c.kind]} | \`${c.keyword.replace(/\|/g, "\\|")}\` | ${c.description.split(/(?<=\.)\s/)[0].replace(/\|/g, "\\|")} |`).join("\n")}`;
  const libRows = (cs) => `| Concept | Library | Written as | Use |\n|---|---|---|---|\n${cs.map((c) => `| [[${c.name}]] | ${c.library} | \`${c.keyword.replace(/\|/g, "\\|")}\` | ${c.description.split(/(?<=\.)\s/)[0].replace(/\|/g, "\\|")} |`).join("\n")}`;
  return `---
type: Language Index
id: sysml-v2-language
status: Draft
---
# SysML v2 in MDSE

${catalog.length} notes in three groups: **${lang.length} language constructs**, **${lib.length} standard-library concepts** and **${pat.length} modeling patterns**. Each note says what it is, which elements it can come from and go to, and what separates it from the most similar one. Source: the OMG SysML v2 specification and the SysML v2 standard library; keywords and forms checked against the Pilot Implementation grammar (\`SysML.xtext\`) and library files.

Do not read "listed here" as "supported". Every note states four separate things: documented, recognized by the Workbench scanner, written by the importer, accepted by a SysML v2 parser. Parser acceptance is not established for any entry until the pinned parser (IMP-068) has been run on its example.

## 1. Language constructs

Every construct is available. Engineers use a handful most of the time, so each carries a use level: **Everyday** (${group(["core"]).length}), **Common** (${group(["common"]).length}), **Occasional** (${group(["occasional"]).length}), **Rare** (${group(["rare"]).length}).

### Everyday

${rows(group(["core"]))}

### Common

${rows(group(["common"]))}

### Occasional

${rows(group(["occasional"]))}

### Rare

${rows(group(["rare"]))}

## 2. Standard-library concepts

Defined in the SysML v2 standard library, written with the language constructs above. They are not new keywords and not MDSE inventions.

${libRows(lib)}

## 3. Modeling patterns

Rules of use that decide which construct to pick. They add no syntax.

${rows(pat)}

## How MDSE uses these notes

- The \`## SysML v2\` block of a note is authoritative (D-0003). These notes define the language that block is written in; they are not model notes and the Workbench index skips \`99_System\`.
- The Workbench scanner recognizes every entry listed here; a statement it does not recognize is reported, not dropped. Which entries become relationships is stated in each note.
- Add or correct an entry in \`governance/language/catalog.json\` and run \`node scripts/build-language.mjs --write\`.
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
