/* Base Vault payload: the files a new vault starts with (ARCHITECTURE.md, "What ships into a vault").
 * Deterministic: same repository content and release give identical output. Text files only.
 * Bundled plugins: Bootstrap and the Workbench (built from this repository) and Templater, Advanced Canvas and Obsidian Git
 * (pinned release files kept under tools/base-vault/vendor, hashed in plugin-lock.yaml). Governed settings come from GOVERNED
 * below: they are seeded into each plugin's data.json and written into plugin-lock.yaml, where Bootstrap re-applies them. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CATEGORY_RULES_PATH, renderCategoryRules } from "../../importer/src/bom_category.ts";

const TEXT = /\.(md|yaml|yml|json|txt)$/i;
const JUNK = /(^|\/)(\.DS_Store|Thumbs\.db)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

/** A plugin shipped in `.obsidian/plugins/<id>/`. `files` maps file name to text. `settings` are governed (MOD-146, BOO-005). */
export interface PluginPayload { id: string; version: string; files: Record<string, string>; source?: string; license?: string; settings?: Record<string, unknown> }
export interface BaseVaultOptions { root: string; release: string; classes: Record<string, { prefix: string; subtype: string[] }>; plugins?: PluginPayload[] }
/** The Workbench plugin as built by `npm run build:workbench` (tools/workbench/dist/plugin). Throws if it has not been built. */
export function workbenchPayload(root: string): PluginPayload {
  const dir = join(root, "tools/workbench/dist/plugin"), files: Record<string, string> = {};
  for (const n of ["main.js", "manifest.json", "styles.css"]) {
    try { files[n] = readFileSync(join(dir, n), "utf8"); } catch { throw new Error(`Workbench plugin not built (${dir}/${n}). Run: npm run build:workbench`); }
  }
  const m = JSON.parse(files["manifest.json"]!);
  return { id: m.id, version: m.version, files, source: "this repository (tools/workbench)", license: "MDSE project" };
}
/** Bootstrap, from tools/bootstrap (plain JavaScript; no build step). */
export function bootstrapPayload(root: string): PluginPayload {
  const d = join(root, "tools/bootstrap"), files = { "main.js": readFileSync(join(d, "src/main.js"), "utf8"), "manifest.json": readFileSync(join(d, "manifest.json"), "utf8"), "styles.css": readFileSync(join(d, "src/styles.css"), "utf8") };
  const m = JSON.parse(files["manifest.json"]);
  return { id: m.id, version: m.version, files, source: "this repository (tools/bootstrap)", license: "MDSE project" };
}
/** Governed settings (BOO-005). Templater and Obsidian Git start from the V1 vault's values; see tools/base-vault/README.md for each choice. */
export const GOVERNED: Record<string, { source: string; license: string; settings?: Record<string, unknown> }> = {
  "templater-obsidian": { source: "https://github.com/SilentVoid13/Templater/releases/tag/2.25.0", license: "AGPL-3.0",
    settings: { data_version: 2, command_timeout: 15, templates_folder: "99_System/05_Templates", templates_pairs: [], trigger_on_file_creation_mode: "none", auto_jump_to_cursor: false, user_scripts_folder: "", folder_templates: [], file_templates: [], syntax_highlighting: true, enabled_templates_hotkeys: [], startup_templates: [], ignore_folders_on_creation: [] } },
  "obsidian-git": { source: "https://github.com/Vinzent03/obsidian-git/releases/tag/2.40.0", license: "MIT",
    settings: { commitMessage: "{{hostname}}: {{numFiles}} files, {{date}}", autoCommitMessage: "{{hostname}}: {{numFiles}} files, {{date}}", autoSaveInterval: 0, autoPushInterval: 0, autoPullInterval: 0, autoPullOnBoot: false, pullBeforePush: true, syncMethod: "merge", disablePush: false, disablePopupsForNoChanges: true, listChangedFilesInMessageBody: true, showStatusBar: true, showBranchStatusBar: true, changedFilesInStatusBar: true } },
  "advanced-canvas": { source: "https://github.com/Developer-Mike/obsidian-advanced-canvas/releases/tag/7.1.0", license: "GPL-3.0" },
};
/** The pinned third-party plugins from tools/base-vault/vendor/<id>/{main.js,manifest.json,styles.css}. */
export function vendoredPayloads(root: string): PluginPayload[] {
  return Object.keys(GOVERNED).map((id) => {
    const d = join(root, "tools/base-vault/vendor", id), files: Record<string, string> = {};
    for (const n of ["main.js", "manifest.json", "styles.css"]) { try { files[n] = readFileSync(join(d, n), "utf8"); } catch { throw new Error(`Missing vendored plugin file ${d}/${n}`); } }
    const m = JSON.parse(files["manifest.json"]!), g = GOVERNED[id]!;
    if (m.id !== id) throw new Error(`${d}/manifest.json has id ${m.id}, expected ${id}`);
    return { id, version: m.version, files, source: g.source, license: g.license, settings: g.settings };
  });
}
/** Every plugin the base vault ships, in activation order: Bootstrap first. */
export function allPayloads(root: string): PluginPayload[] { return [bootstrapPayload(root), workbenchPayload(root), ...vendoredPayloads(root)]; }
export const CORE_PLUGINS = ["file-explorer", "global-search", "switcher", "graph", "backlink", "outgoing-link", "tag-pane", "command-palette", "outline", "file-recovery", "canvas", "properties", "bookmarks", "bases"];
export const REQUIRED_CORE = ["bases", "canvas", "properties", "file-explorer", "command-palette"];
export const PROHIBITED_CORE = ["templates"];     // Templater replaces it; both would act on the same folder
const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

export function buildBaseVault(o: BaseVaultOptions): Record<string, string> {
  const files: Record<string, string> = {};
  const put = (path: string, text: string): void => { files[path] = text.replace(/\r\n/g, "\n"); };
  const copyTree = (srcDir: string, destDir: string, skip: (rel: string) => boolean = () => false): void => {
    for (const f of walk(join(o.root, srcDir))) {
      const rel = relative(join(o.root, srcDir), f).split("\\").join("/");
      if (!TEXT.test(rel) || JUNK.test(rel) || skip(rel)) continue;
      put(`${destDir}/${rel}`, readFileSync(f, "utf8"));
    }
  };
  copyTree("governance/ai", "99_System/02_AI");
  copyTree("governance/language/sysml-v2", "99_System/04_Language");           // D-0028: one note per SysML v2 construct
  copyTree("governance/schemas", "99_System/03_Schemas", (rel) => rel === "ea-family-mapping.json");

  put(".vault.yaml", [
    "# Vault identity. The importer fills vault_uid and vault_name on its first run.", "vault_uid: UNINITIALIZED", "vault_name: UNINITIALIZED", "author: UNINITIALIZED",
    `mdse_release: ${o.release}`, "schema: mdse-vault/0.1", ""].join("\n"));
  put(".obsidian/app.json", JSON.stringify({ alwaysUpdateLinks: true, newLinkFormat: "shortest", useMarkdownLinks: false, showFrontmatter: true, propertiesInDocument: "visible" }, null, 2) + "\n");
  put(".obsidian/core-plugins.json", JSON.stringify(CORE_PLUGINS, null, 2) + "\n");
  const plugins = o.plugins ?? [];
  put(".obsidian/community-plugins.json", JSON.stringify(plugins.map((p) => p.id), null, 2) + "\n");
  for (const p of plugins) for (const [name, text] of Object.entries(p.files)) put(`.obsidian/plugins/${p.id}/${name}`, text);
  for (const p of plugins) if (p.settings) put(`.obsidian/plugins/${p.id}/data.json`, JSON.stringify(p.settings, null, 2) + "\n");
  put(".obsidian/plugin-lock.yaml", [
    "# Controlled plugin release (MOD-146, BOO-005). Generated; do not edit by hand.", "# Bootstrap checks each file against its SHA-256 (LF line ends), enables the plugin, and re-applies `settings` to its data.json.",
    "schema: 2", 'obsidianMinVersion: "1.13.0"', `requiredCorePlugins: [${REQUIRED_CORE.join(", ")}]`, `disabledCorePlugins: [${PROHIBITED_CORE.join(", ")}]`, "plugins:",
    ...plugins.flatMap((p) => [`  ${p.id}:`, `    version: "${p.version}"`, `    source: "${p.source ?? "unknown"}"`, `    license: "${p.license ?? "unknown"}"`, `    settings: ${p.settings ? JSON.stringify(p.settings) : "default"}`, "    sha256:",
      ...Object.entries(p.files).sort(([a], [b]) => (a < b ? -1 : 1)).map(([n, x]) => `      ${n}: ${sha(x.replace(/\r\n/g, "\n"))}`)]), ""].join("\n"));
  put("99_System/THIRD_PARTY_NOTICES.md", ["# Third-party plugins", "", "These community plugins are shipped unmodified, pinned and hashed in `.obsidian/plugin-lock.yaml`. Each keeps its own licence. Source for each release is at the link.", "",
    "| Plugin | Version | Licence | Source |", "|---|---|---|---|", ...plugins.filter((p) => GOVERNED[p.id]).map((p) => `| ${p.id} | ${p.version} | ${p.license} | ${p.source} |`), "",
    "Templater is AGPL-3.0 and Advanced Canvas is GPL-3.0. If you give this vault, with its `.obsidian/plugins` folder, to other people, those licences apply to what you give them.", ""].join("\n"));

  for (const [type, c] of Object.entries(o.classes)) {
    const named = c.subtype.filter(Boolean), sub = named.length ? `subtype: # one of: ${named.join(", ")}` : "subtype:";
    put(`99_System/05_Templates/Template - ${type}.md`, `---\ntype: ${/\s/.test(type) ? JSON.stringify(type) : type}\n${sub}\nid:\nuid:\nstatus: Draft\neaType:\ntags: []\n---\n# <% tp.file.title %>\n\n\n\n## Source: EA\n`);
  }
  const ecoOrder = (JSON.parse(readFileSync(join(o.root, "governance/schemas/properties.json"), "utf8")) as { order: string[] }).order;
  put("99_System/05_Templates/Template - ECO.md", ecoTemplate(ecoOrder));   // MOD-190, D-0164
  put("ECO/ECO-00001.md", ecoExample(ecoOrder));                              // MOD-189, MOD-191, D-0165
  put(".gitignore", `# MDSE vault: files that stay on each user's machine and are not committed.
# Obsidian per-user state (open tabs, layout, appearance, hotkeys, graph filters)
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/workspaces.json
.obsidian/appearance.json
.obsidian/hotkeys.json
.obsidian/graph.json
.obsidian/cache
# Per-user plugin settings and caches. Controlled settings live in plugin-lock.yaml, never in data.json.
.obsidian/plugins/*/data.json
# Temporary Workbench views (one scratch canvas). Saved views in 99_System/23_Saved_Views ARE committed.
99_System/22_Views/*
!99_System/22_Views/README.md
# OS, editor and sync leftovers
.DS_Store
Thumbs.db
desktop.ini
.trash/
*.swp
*~
*.sync-conflict-*
`);
  put("99_System/22_Views/README.md", "# Temporary views\n\nThe Workbench writes one scratch canvas here (`Workbench Preview.canvas`) each time you preview a view. Every preview overwrites it, it is deleted when the Workbench loads or unloads, and Git ignores this folder. Use Save canvas in the Workbench to keep a view; it goes to `99_System/23_Saved_Views` unless you pick another folder.\n");
  put("99_System/23_Saved_Views/README.md", "# Saved views\n\nCanvases you chose to save from the Workbench. This is the default folder; you can save into any project folder instead. Views are pictures of the model, not model content: delete or regenerate them at any time.\n");
  put(CATEGORY_RULES_PATH, renderCategoryRules());   // D-0076: yours to edit; a vault update never overwrites it
  put("99_System/11_Import/README.md", "# Import\n\nRun records, ledgers and review tables written by the importer. Do not edit; fix the source or the mapping and re-import.\n");
  put("README.md", `# MDSE vault\n\nMarkdown Systems Engineering vault (release ${o.release}). SysML v2 text in the last \`## SysML v2\` block of a note is authoritative; everything else is YAML and Markdown.\n\n- AI tools: start at \`99_System/02_AI/AI_INSTRUCTIONS.md\`.\n- Schemas: \`99_System/03_Schemas\`.\n- Imports: \`99_System/11_Import\`.\n`);
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** MOD-190, MOD-191: the ECO note the team starts from, and the one example. Every property is present (MOD-047), in the order of properties.json; the section headings follow MOD-031. */
const ECO_ROLES = ["director", "manager", "lead", "mechanical", "electrical", "design", "project", "product", "purchasing", "quality", "regulatory", "manufacturing"];
const ECO_KEYS = ["name", "jiraKey", "jiraUrl", "ecrDate", "owner", "reason", "branch", "issuedDate", ...ECO_ROLES.flatMap((r) => [`${r}Approver`, `${r}ApprovedOn`]), "approvedOn"];
const yamlText = (v: string): string => (/^[A-Za-z0-9][A-Za-z0-9 ._()\/-]*$/.test(v) && !/^(true|false|null|yes|no|on|off)$/i.test(v) && !/^[\d.]+$/.test(v) ? v : JSON.stringify(v));
function ecoNote(order: readonly string[], head: Record<string, string>, values: Record<string, string>, title: string, body: string[], drives: boolean): string {
  const keys = ECO_KEYS.filter((k) => k !== "name" || values.name);
  const ranked = [...keys].sort((a, b) => { const x = order.indexOf(a), y = order.indexOf(b); return (x < 0 ? 1e6 : x) - (y < 0 ? 1e6 : y) || keys.indexOf(a) - keys.indexOf(b); });
  const fixed = Object.entries(head).map(([k, v]) => `${k}:${v ? " " + v : ""}`);
  const line = (k: string): string => (values[k] ? `${k}: ${yamlText(values[k]!)}` : `${k}:`);
  return ["---", ...fixed, ...ranked.map(line), ...(drives ? ["drives: []"] : []), "---", `# ${title}`, "", ...body, ""].join("\n");
}
const ecoHead = (over: Record<string, string> = {}): Record<string, string> => ({ type: "Info", subtype: "change", id: "", uid: "", status: "Draft", eaType: "", tags: "[]", ...over });
function ecoTemplate(order: readonly string[]): string {
  return ecoNote(order, ecoHead(), {}, "<% tp.file.title %>", [
    "## Description", "", "What changes and why, in a few lines.", "",
    "## Items", "", "One row for each part or assembly the ECO changes. The change description is what the part's own note shows as its latest change.", "",
    "| Item | Action | From | To | Class | Responsible | Change description |", "|---|---|---|---|---|---|---|", "| | | | | | | |", "",
    "## Affected products", "", "For each product the change reaches: the parents of the changed parts, all the way up, and the decision on each (rev up CL1, CL2 or pin change, keep the old pin, or stop here with the reason).", "",
    "| Product | Parent | Revision before | Revision after | Decision | Responsible |", "|---|---|---|---|---|---|", "| | | | | | |", "",
    "## Approvers", "", "Each approver's author code and signing date are the `...Approver` and `...ApprovedOn` properties above. The approval itself is in Jira.", "",
    "## Notes", "", "## Former ids"], true);
}
/** MOD-191: one ECO note with fictional data, so the team can see a finished one. Its parts, people, dates and Jira link are made up, and it links no note. */
function ecoExample(order: readonly string[]): string {
  const title = "EXAMPLE Replace the connector housing on the Demo Charger";
  return ecoNote(order, ecoHead({ id: "ECO-00001", uid: "20260112090000000doejane------", tags: "[example]" }), {
    name: title, jiraKey: "EX-101", jiraUrl: "https://example.com/browse/EX-101", ecrDate: "2026-01-12", owner: "doejane------", reason: "Example only: the housing cracks when the connector is inserted in cold weather", branch: "EX-101", issuedDate: "2026-01-30",
    managerApprover: "roesam-------", managerApprovedOn: "2026-01-26", mechanicalApprover: "poealex------", mechanicalApprovedOn: "2026-01-27", qualityApprover: "doejane------", qualityApprovedOn: "2026-01-28", approvedOn: "2026-01-28" }, title, [
    "> **Example with fictional data.** The parts, people, dates and Jira link below are made up. Nothing here is real. Retire this note when the team no longer needs it.", "",
    "## Description", "", "The Demo Charger's connector housing cracks in cold-weather insertion tests. The housing wall is made thicker, which is a change to fit, form and function (CL1). The power module that uses the housing then points at the new housing revision.", "",
    "## Items", "", "One row for each part or assembly the ECO changes. In a real ECO the Item column links each part's note.", "",
    "| Item | Action | From | To | Class | Responsible | Change description |", "|---|---|---|---|---|---|---|",
    "| EX-1001 Demo connector housing | Alter (CL1) | A01 | B02 | CL1 | poealex------ | Wall thickness raised from 2.0 mm to 2.5 mm to stop cracking in cold-weather insertion. |",
    "| EX-3000 Demo power module | Alter (CL2) | B02 | B03 | CL2 | poealex------ | Now uses housing revision B02. No change to its own fit, form or function. |", "",
    "## Affected products", "", "For each product the change reaches: the parents of the changed parts, all the way up, and the decision on each.", "",
    "| Product | Parent | Revision before | Revision after | Decision | Responsible |", "|---|---|---|---|---|---|",
    "| EX-9000 Demo Charger | EX-3000 Demo power module | B02 | B03 | CL2: only the housing pin changes | poealex------ |",
    "| EX-9000 Demo Charger | EX-9000 Demo Charger | C04 | C04 | Stop here: no fit, form or function change at the product | roesam------- |", "",
    "## Approvers", "", "Each approver's author code and signing date are the `...Approver` and `...ApprovedOn` properties above. The approval itself is in Jira.", "",
    "## Notes", "", "## Former ids"], false);
}
