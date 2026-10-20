#!/usr/bin/env node
// EA to SysML v2 path audit: for every element type, connector type and table in the accepted V1 source profile, where it goes in v2.
//   node scripts/build-ea-paths.mjs          check governance/schemas/EA_TO_V2_PATHS.md is current (CI) and nothing is unaccounted for
//   node scripts/build-ea-paths.mjs --write  regenerate it
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const J = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const profile = J("governance/schemas/ea-source-profile.json"), mapping = J("governance/schemas/ea-family-mapping.json");
const tags = J("governance/schemas/ea-tag-dispositions.json").tags;
const src = fs.readFileSync(path.join(root, "tools/importer/src/ea_source.ts"), "utf8");
const readTables = new Set([...src.matchAll(/scan\("(t_\w+)"\)/g)].map((m) => m[1]));
const ENUM = { RequirementDefinition: "requirement def", PartDefinition: "part def", ActionDefinition: "action def", StateDefinition: "state def", UseCaseDefinition: "use case def", PortDefinition: "port def", ItemDefinition: "item def", AttributeDefinition: "attribute def", ConstraintDefinition: "constraint def", VerificationCaseDefinition: "verification case def", InterfaceDefinition: "interface def" };
const where = (e) => e.disposition === "native_candidate" ? `SysML \`${ENUM[e.native_kind] ?? e.native_kind}\`` : e.disposition === "mdse_note" ? "MDSE note (YAML links, no SysML block)" : e.disposition === "attachment_link" ? "Attachment file and Artifact note" : e.disposition === "folder_only" ? "Folder only" : e.disposition === "reference_only" ? "YAML link only" : e.disposition === "aggregate_boundary_note" ? "Boundary note" : e.disposition === "conditional_review" ? "SysML usage when evidence allows, else a review flag" : e.disposition;
const baseOf = (f) => f.split(":")[0];

const rows = [];
const unaccounted = [];
const lines = [];
lines.push("# EA V1 model to SysML v2: where everything goes", "", `Generated from the accepted source profile (\`${profile.profileId}\`), the approved family mapping and the tag dispositions. Do not edit; run \`node scripts/build-ea-paths.mjs --write\`.`, "");
lines.push("## Elements", "", "| EA element type | Rows | Families | Destination in v2 |", "|---|---|---|---|");
for (const [t, n] of Object.entries(profile.expected.elementTypes)) {
  const fams = mapping.elements.filter((e) => baseOf(e.family) === t);
  if (!fams.length) unaccounted.push(`element type ${t} (${n} rows) has no family in the mapping`);
  const dest = [...new Set(fams.map(where))].join("; ") || "**none**";
  lines.push(`| ${t} | ${n} | ${fams.length} | ${dest} |`);
}
lines.push("", "## Connectors", "", "| EA connector type | Rows | Families | Destination in v2 |", "|---|---|---|---|");
for (const [t, n] of Object.entries(profile.expected.connectorTypes)) {
  const fams = mapping.relationships.filter((e) => baseOf(e.family) === t);
  if (!fams.length) unaccounted.push(`connector type ${t} (${n} rows) has no family in the mapping`);
  const dest = [...new Set(fams.map((e) => e.native_operation ?? e.disposition))].join("; ") || "**none**";
  lines.push(`| ${t} | ${n} | ${fams.length} | ${dest} |`);
}
lines.push("", "## Tables", "", "| EA table | Rows | V1 disposition | Read by the v2 importer | Where it goes |", "|---|---|---|---|---|");
const TABLE_DEST = {
  t_object: "Notes and SysML definitions and usages", t_connector: "SysML relationships; guard, trigger and effect on transitions (PDATA1 to PDATA3)", t_package: "Folders",
  t_objectproperties: "`## Source: EA` lines for kept tags (ea-tag-dispositions.json); requirement text to `doc`", t_document: "Attachment files", t_xref: "Links: conveyed items, transition trigger and effect, entry and do actions, represents, target pins",
  t_operation: "State `entry`, `do`, `exit` actions", t_attribute: "`attribute` usages on the Class", t_operationparams: "None (0 rows)", t_diagram: "Deferred: diagrams are a later, selectable pass (ADR-V2-05)", t_diagramobjects: "Deferred with diagrams", t_diagramlinks: "Deferred with diagrams",
};
const DONE = new Set(["t_object", "t_connector", "t_package", "t_objectproperties", "t_document"]);
for (const [t, n] of Object.entries(profile.expected.tables)) {
  const read = readTables.has(t);
  const status = read ? "yes" : (t.startsWith("t_diagram") ? "no (deferred)" : n === 0 ? "no (empty)" : "**no**");
  if (!read && !t.startsWith("t_diagram") && n > 0) unaccounted.push(`table ${t} (${n} rows) is not read by the importer`);
  lines.push(`| ${t} | ${n} | ${profile.tableDispositions[t]} | ${status} | ${TABLE_DEST[t] ?? ""} |`);
}
const ignored = Object.entries(profile.tableDispositions).filter(([, v]) => v !== "imported");
lines.push("", `${ignored.length} other tables are ignored: ${ignored.filter(([, v]) => v === "ignored_must_be_empty").length} must be empty (the import checks) and ${ignored.filter(([, v]) => v === "ignored_nonempty_approved").length} are non-empty and approved as ignored.`, "");
const d = (x) => tags.filter((t) => t.disposition === x).length;
lines.push("## Tagged values", "", `${tags.length} tags: ${d("body")} kept in the body, ${d("structure")} used by the importer, ${d("drop")} dropped (placeholders and unused). Source: \`ea-tag-dispositions.json\`.`, "");
if (unaccounted.length) lines.push("## Not accounted for", "", ...unaccounted.map((u) => `- ${u}`), "");
else lines.push("## Not accounted for", "", "Nothing: every element type and connector type has a family, and every non-empty table is read or deferred.", "");
const text = lines.join("\n");
const out = path.join(root, "governance/schemas/EA_TO_V2_PATHS.md");
if (process.argv.includes("--write")) { fs.writeFileSync(out, text); console.log("wrote EA_TO_V2_PATHS.md; unaccounted:", unaccounted.length); unaccounted.forEach((u) => console.log(" -", u)); }
else {
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== text) { console.error("EA_TO_V2_PATHS.md is out of date. Run: node scripts/build-ea-paths.mjs --write"); process.exit(1); }
  console.log("ea paths current; unaccounted:", unaccounted.length);
}
