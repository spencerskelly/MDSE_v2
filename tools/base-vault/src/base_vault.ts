/* Base Vault payload: the files a new vault starts with (ARCHITECTURE.md, "What ships into a vault").
 * Deterministic: same repository content and release give identical output. Text files only.
 * GAP: the pinned plugin binaries (Bootstrap, Workbench, Templater, Advanced Canvas, Obsidian Git) are not bundled yet.
 * plugin-lock.yaml says so; the vault opens and works as plain Markdown without them. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TEXT = /\.(md|yaml|yml|json|txt)$/i;
const JUNK = /(^|\/)(\.DS_Store|Thumbs\.db)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

export interface BaseVaultOptions { root: string; release: string; classes: Record<string, { prefix: string; subtype: string[] }> }

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
  copyTree("governance/schemas", "99_System/03_Schemas", (rel) => rel === "ea-family-mapping.json");

  put(".vault.yaml", [
    "# Vault identity. The importer fills vault_uid and vault_name on its first run.", "vault_uid: UNINITIALIZED", "vault_name: UNINITIALIZED", "author: UNINITIALIZED",
    `mdse_release: ${o.release}`, "schema: mdse-vault/0.1", ""].join("\n"));
  put(".obsidian/app.json", JSON.stringify({ alwaysUpdateLinks: true, newLinkFormat: "shortest", useMarkdownLinks: false, showFrontmatter: true, propertiesInDocument: "visible" }, null, 2) + "\n");
  put(".obsidian/core-plugins.json", JSON.stringify(["file-explorer", "global-search", "backlinks", "outgoing-links", "properties", "tag-pane", "outline", "templates", "bases"], null, 2) + "\n");
  put(".obsidian/community-plugins.json", "[]\n");
  put(".obsidian/plugin-lock.yaml", ["# Controlled plugin payload (MOD-146).", "status: NOT_BUNDLED", "note: Plugin binaries are not part of this build. The vault works as plain Markdown. Pinned versions and hashes arrive with the release manifest.", "plugins: []", ""].join("\n"));

  for (const [type, c] of Object.entries(o.classes)) {
    const sub = c.subtype.length ? `subtype: # one of: ${c.subtype.join(", ")}` : "subtype:";
    put(`99_System/05_Templates/Template - ${type}.md`, `---\ntype: ${/\s/.test(type) ? JSON.stringify(type) : type}\n${sub}\nid:\nuid:\nstatus: Draft\neaType:\ntags: []\n---\n# <% tp.file.title %>\n\n\n\n## Source: EA\n`);
  }
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
  put("99_System/11_Import/README.md", "# Import\n\nRun records, ledgers and review tables written by the importer. Do not edit; fix the source or the mapping and re-import.\n");
  put("README.md", `# MDSE vault\n\nMarkdown Systems Engineering vault (release ${o.release}). SysML v2 text in the last \`## SysML v2\` block of a note is authoritative; everything else is YAML and Markdown.\n\n- AI tools: start at \`99_System/02_AI/AI_INSTRUCTIONS.md\`.\n- Schemas: \`99_System/03_Schemas\`.\n- Imports: \`99_System/11_Import\`.\n`);
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
}
