#!/usr/bin/env node
// Inline the core, reader and class table into one self-contained HTML file.
// `--check` exits 1 if the committed output is stale (used in CI).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => fs.readFileSync(path.join(here, p), "utf8");
const strip = (s) => s.replace(/\nif \(typeof module !== "undefined"\)[^\n]*\n?$/, "\n");   // CommonJS export lines have no place in a page
const parts = { READER: strip(rd("src/qeax_reader.js")), CORE: strip(rd("../core/src/mdse_core.js")), CLASSES: JSON.stringify(JSON.parse(rd("../core/src/classes.json"))) };
const version = crypto.createHash("sha256").update(Object.values(parts).join("\0") + rd("src/importer.template.html")).digest("hex").slice(0, 10);
let html = rd("src/importer.template.html");
for (const [k, v] of Object.entries(parts)) html = html.replace(`/*@@${k}@@*/`, () => v);
html = html.replace("/*@@BUILD@@*/", () => `build ${version}`);
if (/\/\*@@\w+@@\*\//.test(html)) { console.error("unreplaced placeholder"); process.exit(1); }
const out = path.join(here, "dist/mdse_importer.html");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== html) { console.error("dist/mdse_importer.html is out of date; run: npm run build:importer"); process.exit(1); }
  console.log("importer html is current (" + version + ")");
} else { fs.writeFileSync(out, html); console.log(`wrote ${path.relative(process.cwd(), out)} (${(html.length / 1024).toFixed(0)} KiB, ${version})`); }
