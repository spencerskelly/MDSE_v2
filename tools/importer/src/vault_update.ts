/* Vault update: bring the configuration of an existing vault up to the shipped Base Vault without a data source.
 * Pure: takes the base payload and a reader for the vault's files, returns the files to write and a row per file saying
 * what happens and why. Never deletes. Notes, attachments, plugin settings (data.json) and anything not in the base are
 * never touched (D-0024). */
import type { OutFile } from "./merge.ts";

/** How each kind of base file is brought up to date. */
export type UpdateKind =
  | "controlled"      // generated, schema-bound content: replaced when different; the old copy is saved first
  | "plugin"          // plugin build: replaced when different
  | "json-union"      // JSON list: the base entries are added, the user's entries stay
  | "json-governed"   // JSON object: the base's keys are set, the user's other keys stay
  | "lines-union"     // line list: missing base lines are appended, nothing removed
  | "vault-yaml"      // identity stays; only mdse_release and schema are updated
  | "seed";           // written only when missing; the user may edit it

export function classifyBasePath(path: string): UpdateKind {
  if (/^99_System\/(02_AI|03_Schemas|04_Language|05_Templates)\//.test(path)) return "controlled";
  if (path === ".obsidian/plugin-lock.yaml") return "controlled";
  if (/^\.obsidian\/plugins\/[^/]+\/(main\.js|manifest\.json|styles\.css)$/.test(path)) return "plugin";
  if (path === ".obsidian/community-plugins.json" || path === ".obsidian/core-plugins.json") return "json-union";
  if (path === ".obsidian/app.json") return "json-governed";
  if (path === ".gitignore") return "lines-union";
  if (path === ".vault.yaml") return "vault-yaml";
  return "seed";
}

export interface UpdateRow { path: string; action: "add" | "replace" | "merge" | "same" | "left"; kind: UpdateKind; reason: string }
export interface UpdateResult {
  status: "WRITE_READY" | "NO_CHANGES"; files: OutFile[]; rows: UpdateRow[];
  summary: { add: number; replace: number; merge: number; same: number; left: number; backups: number };
}
export interface UpdateInput {
  base: Record<string, string>;
  /** Text of a file in the vault, or null when it is not there. */
  read: (path: string) => Promise<string | null>;
  runDate: string;                                    // local time "YYYY-MM-DDTHH:MM:SS"
}

const norm = (s: string): string => s.replace(/\r\n/g, "\n");
const label = (iso: string): string => iso.slice(0, 16).replace("T", " ").replace(":", ".");
const json = (v: unknown): string => JSON.stringify(v, null, 2) + "\n";
const tryJson = (s: string): unknown => { try { return JSON.parse(s); } catch { return undefined; } };
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export async function planVaultUpdate(o: UpdateInput): Promise<UpdateResult> {
  const lab = label(o.runDate), files: OutFile[] = [], rows: UpdateRow[] = [];
  const row = (path: string, action: UpdateRow["action"], kind: UpdateKind, reason: string): void => { rows.push({ path, action, kind, reason }); };
  const backups: string[] = [];
  for (const path of Object.keys(o.base).sort()) {
    const want = norm(o.base[path]!), kind = classifyBasePath(path), have0 = await o.read(path), have = have0 === null ? null : norm(have0);
    if (have === null) { files.push({ path, content: want }); row(path, "add", kind, "missing"); continue; }
    if (have === want) { row(path, "same", kind, "already current"); continue; }
    switch (kind) {
      case "controlled": {
        const bak = `99_System/11_Import/Update ${lab}/Replaced/${path}`;
        files.push({ path: bak, content: have0! }, { path, content: want }); backups.push(bak);
        row(path, "replace", kind, `differs from the release; previous copy saved to ${bak}`); break;
      }
      case "plugin": files.push({ path, content: want }); row(path, "replace", kind, "plugin build differs from the release"); break;
      case "json-union": {
        const a = tryJson(have), b = tryJson(want);
        if (!Array.isArray(a) || !Array.isArray(b)) { row(path, "left", kind, "not a JSON list; left alone"); break; }
        const add = b.filter((x) => !a.includes(x));
        if (!add.length) { row(path, "same", kind, "already has every shipped entry"); break; }
        files.push({ path, content: json([...a, ...add]) }); row(path, "merge", kind, `added ${add.join(", ")}; your other entries kept`); break;
      }
      case "json-governed": {
        const a = tryJson(have) as Record<string, unknown> | undefined, b = tryJson(want) as Record<string, unknown>;
        if (!a || typeof a !== "object" || Array.isArray(a)) { row(path, "left", kind, "not a JSON object; left alone"); break; }
        const changed = Object.keys(b).filter((k) => !same(a[k], b[k]));
        if (!changed.length) { row(path, "same", kind, "governed settings already current"); break; }
        files.push({ path, content: json({ ...a, ...b }) }); row(path, "merge", kind, `set ${changed.join(", ")}; your other settings kept`); break;
      }
      case "lines-union": {
        const mine = new Set(have.split("\n").map((l) => l.trim())), add = want.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#") && !mine.has(l.trim()));
        if (!add.length) { row(path, "same", kind, "already has every shipped line"); break; }
        files.push({ path, content: have.replace(/\n*$/, "\n") + `\n# Added by MDSE update ${lab}\n${add.join("\n")}\n` }); row(path, "merge", kind, `appended ${add.length} line(s); nothing removed`); break;
      }
      case "vault-yaml": {
        const pick = (s: string, k: string): string | undefined => new RegExp(`^${k}:\\s*(.*)$`, "m").exec(s)?.[1]?.trim();
        let text = have; const changed: string[] = [];
        for (const k of ["mdse_release", "schema"]) {
          const w = pick(want, k); if (w === undefined || pick(text, k) === w) continue;
          text = pick(text, k) === undefined ? text.replace(/\n*$/, "\n") + `${k}: ${w}\n` : text.replace(new RegExp(`^${k}:.*$`, "m"), `${k}: ${w}`); changed.push(k);
        }
        if (!changed.length) { row(path, "same", kind, "identity kept; release already current"); break; }
        files.push({ path, content: text }); row(path, "merge", kind, `set ${changed.join(", ")}; vault identity kept`); break;
      }
      case "seed": row(path, "left", kind, "exists; yours to edit, not overwritten"); break;
    }
  }
  const count = (a: UpdateRow["action"]): number => rows.filter((r) => r.action === a).length;
  const summary = { add: count("add"), replace: count("replace"), merge: count("merge"), same: count("same"), left: count("left"), backups: backups.length };
  if (!files.length) return { status: "NO_CHANGES", files, rows, summary };
  const changedRows = rows.filter((r) => r.action === "add" || r.action === "replace" || r.action === "merge");
  files.push({ path: `99_System/11_Import/Vault Update ${lab}.md`, content: `# Vault Update ${lab}\n\nConfiguration brought up to the shipped release. No notes were read or changed; nothing was deleted.\n\n| File | Action | Why |\n|---|---|---|\n${changedRows.map((r) => `| \`${r.path}\` | ${r.action} | ${r.reason.replace(/\|/g, "/")} |`).join("\n")}\n\n${summary.same} file(s) were already current; ${summary.left} yours were left alone.${backups.length ? ` Replaced copies are under \`99_System/11_Import/Update ${lab}/Replaced/\`; delete them once you are satisfied.` : ""}\n` });
  return { status: "WRITE_READY", files, rows, summary };
}
