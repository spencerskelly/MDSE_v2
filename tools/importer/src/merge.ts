/* Add-onto-existing (D-0014): additive. Nothing is deleted; empty YAML is filled; a changed value is written only when pre-approved,
 * otherwise a flagConflict is added to the note. A source row that has vanished gets a flagImport. Identical input = no writes. */
import MDSE from "../../core/src/mdse_core.js";
import { flagCallout } from "./notes.ts";

export interface OutFile { path: string; content: string; /** binary file (attachment); content is empty */ bytes?: Uint8Array }
export interface ExistingVault { hasVault: boolean; files: Map<string, string>; /** every file path in the vault, any type; attachments are never overwritten */ allPaths?: Set<string> }
export interface ChangeEntry { path: string; kind: "created" | "filled" | "changed" | "appended" | "conflict" | "flagged"; field: string; detail: string }

export interface MergeInput {
  generated: Array<{ path: string; text: string; guid: string }>;
  existing: ExistingVault | null;
  preApproved: string[];
  sourceLink: string;
  runLabel: string;
  sourceName: string;
  presentGuids: Set<string>;
}
export interface MergePlan { writes: OutFile[]; changes: ChangeEntry[]; changed: boolean; created: number; unchanged: number; updated: number; conflicts: number; changelog: string }

const SKIP_KEYS = new Set(["id", "uid", "status", "tags"]);          // identity never moves; status and tags belong to the engineer
const SOURCE = "## Source: EA", SYSML = "## SysML v2";

function fmLines(text: string): { lines: string[]; close: number } {
  const lines = text.split("\n");
  return { lines, close: lines.indexOf("---", 1) };
}
const keyOf = (l: string): string | null => /^([A-Za-z][\w-]*):/.exec(l)?.[1] ?? null;

/** Inserts a callout at the end of the user zone (before the managed headings). */
function addFlag(text: string, flag: string): string {
  const n = MDSE.parse(text);
  const hit = n.h2.find(([, h]: [number, string]) => h === SOURCE || h === SYSML);
  if (!hit) return text.replace(/\n+$/, "") + "\n\n" + flag + "\n";
  const head = n.text.slice(0, hit[0]).replace(/\n+$/, ""), tail = n.text.slice(hit[0]);
  return head + "\n\n" + flag + "\n\n\n\n" + tail;
}
const hasFlag = (text: string, type: string, title: string): boolean => text.includes(`> [!${type}] ${title}`);

function sourceLinesOf(text: string): string[] {
  const n = MDSE.parse(text), hit = n.h2.find(([, h]: [number, string]) => h === SOURCE);
  if (!hit) return [];
  const next = n.h2.find(([p]: [number, string]) => p > hit[0]);
  return n.text.slice(hit[0] + SOURCE.length, next ? next[0] : n.text.length).split("\n").filter((l: string) => l.trim());
}

function mergeOne(ex: string, gen: string, path: string, o: MergeInput, changes: ChangeEntry[]): string {
  let text = ex;
  const log = (kind: ChangeEntry["kind"], field: string, detail: string): void => { changes.push({ path, kind, field, detail }); };
  const E = fmLines(text), G = fmLines(gen);
  const eMap = new Map<string, number>(); E.lines.forEach((l, i) => { if (i > 0 && i < E.close) { const k = keyOf(l); if (k) eMap.set(k, i); } });
  const conflictFlags: string[] = [];
  const inserts: string[] = [];
  for (let i = 1; i < G.close; i++) {
    const gl = G.lines[i]!, k = keyOf(gl); if (!k || SKIP_KEYS.has(k)) continue;
    const at = eMap.get(k);
    if (at === undefined) { inserts.push(gl); log("filled", k, `added ${gl.slice(k.length + 1).trim()}`); continue; }
    const el = E.lines[at]!;
    if (el === gl) continue;
    const eVal = el.slice(k.length + 1).trim(), gVal = gl.slice(k.length + 1).trim();
    if (!eVal) { E.lines[at] = gl; log("filled", k, `filled ${gVal}`); continue; }
    if (o.preApproved.includes(k)) { E.lines[at] = gl; log("changed", k, `${eVal} -> ${gVal} (pre-approved)`); continue; }
    const title = `Source differs: ${k}`;
    if (!hasFlag(ex, "flagConflict", title)) { conflictFlags.push(flagCallout("flagConflict", title, o.sourceLink, [`Note has \`${eVal}\`, source has \`${gVal}\`. Nothing was changed.`])); log("conflict", k, `${eVal} vs ${gVal}`); }
  }
  if (inserts.length) E.lines.splice(E.close, 0, ...inserts);
  text = E.lines.join("\n");

  // flags from the generated note, added once (matched by their title line)
  const gn = MDSE.parse(gen);
  for (const m of gn.text.slice(gn.fmEnd).matchAll(/^> \[!(flag\w+)\] (.+)\n(?:>.*(?:\n|$))*/gm)) {
    if (!hasFlag(text, m[1]!, m[2]!)) { text = addFlag(text, m[0].replace(/\n+$/, "")); log("flagged", m[1]!, m[2]!); }
  }
  for (const f of conflictFlags) text = addFlag(text, f);

  // Source: EA - append lines the note does not have; never remove
  const have = new Set(sourceLinesOf(text)), add = sourceLinesOf(gen).filter((l) => !have.has(l));
  if (add.length) {
    const n = MDSE.parse(text), hit = n.h2.find(([, h]: [number, string]) => h === SOURCE);
    if (hit) {
      const next = n.h2.find(([p]: [number, string]) => p > hit[0]);
      const cut = next ? next[0] : n.text.length;
      const body = n.text.slice(0, cut).replace(/\n+$/, "");
      text = body + "\n" + add.join("\n") + "\n" + (next ? "\n" + n.text.slice(cut) : "");
    } else text = text.replace(/\n+$/, "") + `\n\n\n\n${SOURCE}\n\n${add.join("\n")}\n`;
    log("appended", "Source: EA", `${add.length} line(s)`);
  }

  // SysML block
  const gS = MDSE.extractSysml(gen), eS = MDSE.extractSysml(text);
  if (gS !== null) {
    if (eS === null) { text = MDSE.replaceSysmlBlock(text, gS); log("filled", "sysml", "block added"); }
    else if (eS.replace(/\s+$/, "") !== gS.replace(/\s+$/, "")) {
      if (o.preApproved.includes("sysml")) { text = MDSE.replaceSysmlBlock(text, gS); log("changed", "sysml", "block replaced (pre-approved)"); }
      else if (!hasFlag(text, "flagConflict", "Source differs: sysml")) {
        text = addFlag(text, flagCallout("flagConflict", "Source differs: sysml", o.sourceLink, ["The SysML v2 block in this note differs from the source. Nothing was changed."]));
        log("conflict", "sysml", "block differs");
      }
    }
  }
  return text;
}

export function planMerge(o: MergeInput): MergePlan {
  const writes: OutFile[] = [], changes: ChangeEntry[] = [];
  let created = 0, unchanged = 0, updated = 0;
  const files = o.existing?.files ?? new Map<string, string>();
  for (const g of o.generated) {
    const ex = files.get(g.path);
    if (ex === undefined) { writes.push({ path: g.path, content: g.text }); changes.push({ path: g.path, kind: "created", field: "", detail: "new note" }); created++; continue; }
    const before = changes.length, out = mergeOne(ex, g.text, g.path, o, changes);
    if (out !== ex) { writes.push({ path: g.path, content: out }); updated++; } else unchanged++;
    void before;
  }
  // notes whose source row has gone: flag, never delete
  if (o.existing) {
    const gen = new Set(o.generated.map((g) => g.path));
    for (const [path, text] of files) {
      if (gen.has(path) || !/\.md$/i.test(path)) continue;
      const m = /^- EA GUID: (.+)$/m.exec(text); if (!m || o.presentGuids.has(m[1]!.trim())) continue;
      const title = "Missing from source";
      if (hasFlag(text, "flagImport", title)) continue;
      try { writes.push({ path, content: addFlag(text, flagCallout("flagImport", title, o.sourceLink, [`EA GUID ${m[1]!.trim()} was not in ${o.sourceName}. The note was kept.`])) }); } catch { continue; }
      changes.push({ path, kind: "flagged", field: "flagImport", detail: title }); updated++;
    }
  }
  const conflicts = changes.filter((c) => c.kind === "conflict").length;
  const changed = writes.length > 0;
  const changelog = changed ? `# Changelog ${o.runLabel}\n\nSource \`${o.sourceName}\`.\n\n| Note | Change | Field | Detail |\n|---|---|---|---|\n${changes.map((c) => `| ${c.path.replace(/\|/g, "\\|")} | ${c.kind} | ${c.field} | ${c.detail.replace(/\|/g, "\\|")} |`).join("\n")}\n` : "";
  return { writes, changes, changed, created, unchanged, updated, conflicts, changelog };
}
