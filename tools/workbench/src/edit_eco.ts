/* ECO note and its impact (D-0131, BOM-051, GOV-026). Slice one: pick the changed items, see where each is used, check, and write the
 * ECO note on the working tree. It plans only; the Edit lens shows the diff and applies it with an Undo.
 * Not here: creating the branch (the engineer does, GOV-028), new parts (OD-24 first), the check across open branches (OD-26), approval (Jira). */
import type { ModelIndex, Note } from "./index.ts";
import type { EditPlan, EdClasses } from "./edit.ts";
import * as ED from "./edit.ts";
import * as V from "./views.ts";
import { plmLink } from "./edit_plm.ts";

export const ECO_ACTIONS = [["alter-cl1", "Alter (CL1)"], ["alter-cl2", "Alter (CL2)"], ["adjust-usage", "Adjust usage"]] as const;
export type EcoAction = (typeof ECO_ACTIONS)[number][0];
export interface EcoItem { path: string; action: EcoAction; /** the revision after the change, typed in: PDM issues it (PLM-001) */ to?: string; /** author code of the person responsible (BOM-051) */ person: string }
export interface EcoInput { reason: string; description: string; owner: string; ecrDate: string; jiraUrl: string; jiraKey?: string; branch?: string; items: EcoItem[]; folder: string; author: string; now?: Date }
export interface EcoCheck { level: "error" | "warn"; item: string; text: string }
export interface EcoImpactRow { path: string; title: string; partNumber: string; revision: string; depth: number; via: string[] }

/** Every assembly above the items (V.whereUsed, depth 8), once each, with the items it contains and its shallowest depth. */
export function ecoImpact(ix: ModelIndex, items: string[], maxDepth = 8): EcoImpactRow[] {
  const acc = new Map<string, EcoImpactRow>();
  for (const it of items) {
    const walk = (nodes: V.TreeNode[], depth: number): void => {
      for (const c of nodes) {
        if (c.path && !items.includes(c.path)) {
          const n = ix.notes.get(c.path), cur = acc.get(c.path);
          if (!cur) acc.set(c.path, { path: c.path, title: n?.title ?? c.path!, partNumber: String(n?.meta.partNumber ?? ""), revision: String(n?.meta.revision ?? ""), depth, via: [it] });
          else { cur.depth = Math.min(cur.depth, depth); if (!cur.via.includes(it)) cur.via.push(it); }
        }
        if (!c.cycle) walk(c.children, depth + 1);
      }
    };
    walk(V.whereUsed(ix, it, maxDepth).tree.children, 1);
  }
  return [...acc.values()].sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title));
}

const isEco = (n: Note): boolean => n.type === "Info" && n.subtype === "change";
/** The notes an ECO note lists in `drives` (resolved links of the note). */
export function ecoDrives(ix: ModelIndex, eco: Note): Note[] {
  return eco.links.filter((l) => l.field === "drives").map((l) => ix.byName.get(l.target.toLowerCase())).map((p) => (p ? ix.notes.get(p) : undefined)).filter((n): n is Note => !!n);
}

/** The checks of slice one. `error` blocks the plan; `warn` is shown. GOV-031 is checked here only against ECO notes in this working tree that have no approval date: other open branches are not visible (OD-26). */
export function ecoChecks(ix: ModelIndex, items: EcoItem[]): EcoCheck[] {
  const out: EcoCheck[] = [], seen = new Set<string>();
  const others = [...ix.notes.values()].filter((n) => isEco(n) && !n.meta.approvedOn);
  for (const it of items) {
    const n = ix.notes.get(it.path), t = n?.title ?? it.path;
    if (!n) { out.push({ level: "error", item: t, text: "This note is not in the vault." }); continue; }
    if (seen.has(it.path)) out.push({ level: "error", item: t, text: "Listed twice." }); seen.add(it.path);
    if (!String(n.meta.partNumber ?? "").trim()) out.push({ level: "error", item: t, text: "Has no part number; an ECO changes parts (BOM-051)." });
    if (!it.person.trim()) out.push({ level: "error", item: t, text: "No responsible person (BOM-051)." });
    if (it.action !== "adjust-usage" && !String(n.meta.revision ?? "").trim() && n.meta.level !== undefined) out.push({ level: "warn", item: t, text: "No revision on the note, so the From column is blank." });
    if (!ix.edges.some((e) => e.kind === "implements" && e.via === "yaml" && e.from === it.path)) out.push({ level: "warn", item: t, text: "Implements no element (MOD-187)." });
    for (const o of others) if (ecoDrives(ix, o).some((d) => d.path === it.path)) out.push({ level: "error", item: t, text: `Already driven by ${o.title} (${o.id}), which is not approved yet (GOV-031).` });
  }
  return out;
}

const q = (s: string): string => (/^[A-Za-z0-9][A-Za-z0-9 ._()\/:-]*$/.test(s) && !/^(true|false|null|yes|no|on|off)$/i.test(s) && !/^[\d.]+$/.test(s) ? s : JSON.stringify(s));
const cell = (s: string): string => s.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();
const jiraKeyOf = (url: string): string => /\b([A-Z][A-Z0-9]+-\d+)\b/.exec(url)?.[1] ?? "";

/** The ECO note: `reason`, `owner`, `ecrDate`, `jiraKey`, `jiraUrl`, `branch` and the `drives` list in YAML, the description as the text, and a table of the items with their responsible people. */
export function planCreateEco(ix: ModelIndex, classes: EdClasses, o: EcoInput): EditPlan {
  const bad = (p: string[]): EditPlan => ({ summary: "", writes: [], problems: p });
  const reason = o.reason.replace(/\s+/g, " ").trim(), desc = o.description.replace(/\r\n/g, "\n").trim(), owner = o.owner.trim(), url = o.jiraUrl.trim(), date = o.ecrDate.trim();
  const problems: string[] = [];
  if (!reason) problems.push("A reason is required.");
  if (!desc) problems.push("A description is required.");
  if (!owner || /\s/.test(owner)) problems.push("The owner is an author code, without spaces.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) problems.push("The ECR date is YYYY-MM-dd.");
  if (!/^https?:\/\/\S+$/.test(url)) problems.push("The Jira link must start with http:// or https://.");
  if (!o.items.length) problems.push("Add at least one changed item.");
  const key = (o.jiraKey ?? "").trim() || jiraKeyOf(url);
  if (!key) problems.push("No Jira key: type it, or use a link that contains it (for example .../browse/ABC-123).");
  for (const c of ecoChecks(ix, o.items)) if (c.level === "error") problems.push(`${c.item}: ${c.text}`);
  if (problems.length) return bad(problems);
  const name = (key + " " + reason).slice(0, 90).trim();
  const base = ED.planAddElement(ix, classes, { type: "Info", subtype: "change", title: name, folder: o.folder, author: o.author, now: o.now });
  if (base.problems.length) return base;
  const w = base.writes[0]!, notes = o.items.map((i) => ({ i, n: ix.notes.get(i.path)! }));
  const links = notes.map((x) => plmLink(x.n)).sort();
  const yaml = [`reason: ${q(reason)}`, `owner: ${q(owner)}`, `ecrDate: ${date}`, `jiraKey: ${q(key)}`, `jiraUrl: ${JSON.stringify(url)}`, ...((o.branch ?? "").trim() ? [`branch: ${q(o.branch!.trim())}`] : []), `drives: [${links.map((l) => JSON.stringify(l)).join(", ")}]`].join("\n");
  const label = (a: EcoAction): string => ECO_ACTIONS.find((x) => x[0] === a)![1];
  const table = ["| Item | Action | From | To | Responsible |", "|---|---|---|---|---|", ...notes.map(({ i, n }) => `| ${plmLink(n)} | ${label(i.action)} | ${cell(String(n.meta.revision ?? ""))} | ${cell(i.to ?? "")} | ${cell(i.person)} |`)].join("\n");
  const after = w.after.replace(/^(name: .*)$/m, `$1\n${yaml}`).replace(/^(# .*\n)/m, `$1\n## Description\n\n${desc}\n\n## Items\n\n${table}\n`);
  return { summary: `Add ECO "${name}" (${w.path}) driving ${notes.length} note${notes.length === 1 ? "" : "s"}.`, writes: [{ ...w, after }], problems: [] };
}
