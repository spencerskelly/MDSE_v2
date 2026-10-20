// Tiny CLI over the importer core so Python tests can cross-check it. Not shipped.
const fs = require("fs"), path = require("path");
const M = require(path.join(__dirname, "../../../tools/core/src/mdse_core.js"));
const classes = require(path.join(__dirname, "../../../tools/core/src/classes.json"));
const [cmd, ...args] = process.argv.slice(2);
if (cmd === "validate") {
  const out = {}; for (const f of args) out[f] = M.validate(fs.readFileSync(f, "utf8"), classes).map((i) => i.code).sort();
  console.log(JSON.stringify(out));
} else if (cmd === "zip") {
  const [dest, ...files] = args;
  fs.writeFileSync(dest, M.zip(files.map((f) => [path.basename(f), new Uint8Array(fs.readFileSync(f))])));
} else if (cmd === "replace") {
  const [note, sysml] = args; process.stdout.write(M.replaceSysmlBlock(fs.readFileSync(note, "utf8"), fs.readFileSync(sysml, "utf8")));
} else { console.error("usage: validate|zip|replace"); process.exit(2); }
