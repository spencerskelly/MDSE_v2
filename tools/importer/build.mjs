#!/usr/bin/env node
// Inline the core, reader and class table into one self-contained HTML file.
// `--check` exits 1 if the committed output is stale (used in CI).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";
import { renderTranslationDoc } from "./src/translation.ts";
import { buildBaseVault, allPayloads } from "../base-vault/src/base_vault.ts";
const here = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => fs.readFileSync(path.join(here, p), "utf8");
const strip = (s) => s.replace(/\nif \(typeof module !== "undefined"\)[^\n]*\n?$/, "\n");   // CommonJS export lines have no place in a page
// TypeScript modules -> one plain script: imports and `export` removed, types stripped (erasable syntax only).
const TS_ORDER = ["sha256", "ea_source", "ea_mapping", "identity", "naming", "sysml", "notes", "csv", "merge", "translation", "vault_update", "bom", "run", "preflight"];
const bundleTs = () => TS_ORDER.map((n) => {
  const code = rd(`src/${n}.ts`).replace(/^import [^;]*;\s*$/gm, "").replace(/^export type \{[^}]*\}( from [^;]*)?;\s*$/gm, "").replace(/^export (?=(async |function|const|class|interface|type))/gm, "");
  return `/* ${n}.ts */\n` + stripTypeScriptTypes(code, { mode: "strip" });
}).join("\n");
const classes = JSON.parse(rd("../core/src/classes.json"));
const RELEASE = JSON.parse(fs.readFileSync(path.join(here, "../../package.json"), "utf8")).version ?? "0.0.0-dev";
const parts = { RELEASE: JSON.stringify(RELEASE), IMPORTER: bundleTs(), TAGS: JSON.stringify(JSON.parse(fs.readFileSync(path.join(here, "../../governance/schemas/ea-tag-dispositions.json"), "utf8"))), MAPPING: JSON.stringify(JSON.parse(fs.readFileSync(path.join(here, "../../governance/schemas/ea-family-mapping.json"), "utf8"))),
  BASEVAULT: JSON.stringify(buildBaseVault({ root: path.join(here, "../.."), release: JSON.parse(fs.readFileSync(path.join(here, "../../package.json"), "utf8")).version ?? "0.0.0-dev", classes, plugins: allPayloads(path.join(here, "../..")) })),
   READER: strip(rd("src/qeax_reader.js")), XLSX: strip(rd("src/xlsx_reader.js")), CORE: strip(rd("../core/src/mdse_core.js")), CLASSES: JSON.stringify(JSON.parse(rd("../core/src/classes.json"))) };
const version = crypto.createHash("sha256").update(Object.values(parts).join("\0") + rd("src/importer.template.html")).digest("hex").slice(0, 10);
let html = rd("src/importer.template.html");
for (const [k, v] of Object.entries(parts)) html = html.replace(`/*@@${k}@@*/`, () => v);
html = html.replace("/*@@BUILD@@*/", () => `build ${version}`);
if (/\/\*@@\w+@@\*\//.test(html)) { console.error("unreplaced placeholder"); process.exit(1); }
const transDoc = renderTranslationDoc(JSON.parse(fs.readFileSync(path.join(here, "../../governance/schemas/ea-family-mapping.json"), "utf8")));
const transOut = path.join(here, "TRANSLATION.md");
const out = path.join(here, "dist/mdse_importer.html");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(transOut) || fs.readFileSync(transOut, "utf8") !== transDoc) { console.error("tools/importer/TRANSLATION.md is out of date; run: npm run build:importer"); process.exit(1); }
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== html) { console.error("dist/mdse_importer.html is out of date; run: npm run build:importer"); process.exit(1); }
  console.log("importer html is current (" + version + ")");
} else { fs.writeFileSync(transOut, transDoc); fs.writeFileSync(out, html); console.log(`wrote ${path.relative(process.cwd(), out)} (${(html.length / 1024).toFixed(0)} KiB, ${version})`); }
