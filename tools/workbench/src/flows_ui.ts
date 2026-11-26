/* The Flow view (D-0169, WKB-076): one scrollable form per flow, drawn inside the Workbench panel. Plain DOM; vault
 * strings are set as text. The logic is in flows.ts. Saving goes through the host's applyPlan (compare-before-write, Undo). */
import { h } from "./ui.ts";
import type { Child } from "./ui.ts";
import type { ModelIndex } from "./index.ts";
import type { EditPlan } from "./edit.ts";
import * as F from "./flows.ts";

export interface FlowHost {
  files(): Map<string, string>;
  /** registered 13-character author code, "" when none */
  author(): string;
  applyPlan(plan: EditPlan): Promise<{ message: string; undo: () => Promise<string> }>;
}
export interface FlowCtx {
  getIx(): ModelIndex | null;
  host: FlowHost;
  open(path: string): void;
  /** report a message (and an undo) in the panel's status line */
  done(message: string, undo: (() => Promise<string>) | null): void;
}

interface Current { def: F.FlowDef; rec: F.FlowRecord }
let CUR: Current | null = null;
export const currentFlow = (): Current | null => CUR;
export const closeFlow = (): void => { CUR = null; };

/** Start a new flow on the selected note. Returns an error message, or "" when started. */
export function beginFlow(defId: string, ix: ModelIndex | null, sel: string, host: FlowHost, now = new Date()): string {
  const def = F.flowDef(defId); if (!def) return `Unknown flow ${defId}.`;
  const author = host.author();
  if (!author) return "Register your author code first (Bootstrap, or 99_System vault settings): a flow is signed with it.";
  const records = F.listFlows(host.files()).map((x) => x.rec);
  CUR = { def, rec: F.startFlow(def, ix, ix?.notes.has(sel) ? sel : "", author, now, records) };
  return "";
}
/** Reopen a saved flow record. Returns an error message, or "". */
export function openFlowRecord(path: string, host: FlowHost): string {
  const text = host.files().get(path); if (text === undefined) return `${path} is not in the vault.`;
  const rec = F.parseFlowNote(text), def = rec ? F.flowDef(rec.flow) : undefined;
  if (!rec || !def) return `${path} is not a flow record this Workbench can read.`;
  CUR = { def, rec }; return "";
}
/** The entries of the Flow drop-down: flows to start, by group, and saved flows to reopen. */
export function flowMenu(files: Map<string, string> | null): { start: Array<{ group: string; items: Array<{ id: string; label: string }> }>; open: Array<{ path: string; label: string }> } {
  const start = F.FLOW_GROUPS.map((g) => ({ group: g, items: F.flowDefs().filter((d) => d.group === g).map((d) => ({ id: d.id, label: d.name })) }));
  const open = files ? F.listFlows(files).slice(0, 25).map(({ path, rec }) => ({ path, label: `${rec.flowId} · ${F.flowDef(rec.flow)?.name ?? rec.flow}${rec.pickTitle ? " · " + rec.pickTitle : ""}${rec.status === "complete" ? " (complete)" : ""}` })) : [];
  return { start, open };
}

export const FLOW_STYLE = `
.mdfl .fhd{border:1px solid var(--line);border-radius:8px;padding:8px;margin:0 0 8px;background:var(--bg2)}
.mdfl .fhd .ids{font-size:11px;color:var(--mut);word-break:break-all}.mdfl .fhd .cnt{font-size:12px;margin-top:4px}
.mdfl details.fs{border:1px solid var(--line);border-radius:8px;margin:0 0 8px;padding:0 8px 8px}
.mdfl details.fs>summary{cursor:pointer;padding:6px 0;font-weight:600;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.mdfl .chip{font-size:11px;font-weight:500;border-radius:999px;padding:1px 7px;border:1px solid var(--line)}
.mdfl .chip.ok{background:#e7f5ec;color:#1b7a3a;border-color:#9fd3b1}.mdfl .chip.st{background:#fff4e0;color:#8a5300;border-color:#f0c27a}
.mdfl .who{font-size:11.5px;color:var(--mut)}.mdfl .intro{font-size:12.5px;margin:4px 0 6px}
.mdfl .grp{margin:8px 0}.mdfl .grp>b{font-size:12px}.mdfl .grp.crit>b{color:var(--acc)}.mdfl .grp .cap{font-size:11.5px;color:var(--mut)}
.mdfl label.fl{display:block;font-size:12px;color:var(--mut);margin:6px 0 2px}.mdfl label.fl .req{color:#b3261e}
.mdfl input[type=text],.mdfl select,.mdfl textarea{width:100%;box-sizing:border-box}.mdfl textarea{min-height:56px}
.mdfl .chg input,.mdfl .chg select,.mdfl .chg textarea{outline:2px solid #2557d6;outline-offset:-1px}.mdfl .was{font-size:11px;color:#2557d6}
.mdfl .ro{font-size:12.5px;padding:2px 0}.mdfl .hint{font-size:11px;color:var(--mut)}.mdfl .tag{font-size:10.5px;color:var(--mut);margin-left:4px}
.mdfl .tbl{overflow-x:auto;margin:6px 0}.mdfl table{border-collapse:collapse;font-size:12px;width:100%}.mdfl th,.mdfl td{border-top:1px solid var(--line);padding:2px 3px;text-align:left;vertical-align:top}
.mdfl td input,.mdfl td select{min-width:70px}.mdfl .yaml{font-family:var(--font-monospace,monospace);font-size:11.5px;border:1px solid var(--line);border-radius:6px;padding:4px 6px}
.mdfl .yaml .c{background:#e8efff}.mdfl .subrow{display:flex;gap:8px;align-items:center;margin-top:8px;padding-top:6px;border-top:1px dashed var(--line);font-size:12.5px}
.mdfl .err{color:#b3261e;font-size:12px}
`;

/** The view. It keeps its own element and redraws in place, so typing never loses focus. */
export function flowView(ctx: FlowCtx): HTMLElement {
  const root = h("div", { class: "mdfl" });
  const open = new Set<string>();
  let note = "", busy = false;
  const scrollBox = (): HTMLElement | null => { let e: HTMLElement | null = root.parentElement; while (e && e.scrollHeight <= e.clientHeight) e = e.parentElement; return e; };
  const redraw = (): void => { const sb = scrollBox(), top = sb?.scrollTop ?? 0; root.replaceChildren(...draw().filter((c): c is Node | string => !!c)); if (sb) sb.scrollTop = top; };

  function draw(): Child[] {
    if (!CUR) return [h("div", { class: "mut" }, "Choose a flow from the Flow menu beside the work areas. It starts on the note selected here.")];
    const { def, rec } = CUR, ix = ctx.getIx(), secs = F.flowSections(def);
    const subs = secs.filter(F.submittable), done = subs.filter((s) => F.sectionState(def, rec, s) === "submitted").length;
    const changed = Object.keys(rec.base).filter((k) => (rec.vals[k] ?? "") !== rec.base[k]).length;
    const missing = subs.reduce((a, s) => a + F.missingRequired(def, rec, s).length, 0);
    const saved = ctx.host.files().has(F.flowPath(rec.flowId));
    const head = h("div", { class: "fhd" },
      h("div", {}, h("b", {}, `${def.name} flow`), " ", h("span", { class: "chip" + (rec.status === "complete" ? " ok" : "") }, rec.status === "complete" ? "All sections submitted" : "Open")),
      h("div", { class: "ids" }, `Flow ID ${rec.flowId} · GUID ${rec.guid}`),
      h("div", { class: "cnt" }, "Works on: ", rec.pick ? h("a", { href: "#", onclick: (e: Event) => { e.preventDefault(); ctx.open(rec.pick); } }, rec.pickTitle || rec.pick) : h("i", {}, "nothing selected"), h("span", { class: "mut" }, ` (${def.pick})`)),
      h("div", { class: "cnt" }, `${done} of ${subs.length} sections submitted · ${changed} field${changed === 1 ? "" : "s"} changed · ${missing} required field${missing === 1 ? "" : "s"} empty`),
      h("div", { class: "cnt mut" }, saved ? `Saved as ${F.flowPath(rec.flowId)}. Each submit saves it again.` : "Not saved yet. The first submitted section saves the flow."),
      h("div", { class: "acts2" },
        saved ? h("button", { class: "sm", onclick: () => ctx.open(F.flowPath(rec.flowId)) }, "Open the record note") : null,
        h("button", { class: "sm", onclick: () => { for (const s of secs) open.add(s.key); redraw(); } }, "Expand all"),
        h("button", { class: "sm", onclick: () => { open.clear(); redraw(); } }, "Collapse all"),
        h("button", { class: "sm", onclick: () => { closeFlow(); ctx.done("Flow closed. Saved sections stay in the record; reopen it from the Flow menu.", null); } }, "Close flow")),
      note ? h("div", { class: "err" }, note) : null,
      !rec.pick && def.id !== "NEW" ? h("div", { class: "err" }, `No note was selected when this flow started. It expects: ${def.pick}.`) : null);
    if (!open.size) { const first = subs.find((s) => F.sectionState(def, rec, s) !== "submitted"); open.add((first ?? secs[0]!).key); }
    return [head, ...secs.map((s, i) => section(def, rec, s, i, ix))];
  }

  function section(def: F.FlowDef, rec: F.FlowRecord, s: F.FlowSection, i: number, ix: ModelIndex | null): HTMLElement {
    const st = F.sectionState(def, rec, s), can = F.submittable(s);
    const chip = !can ? null : st === "submitted" ? h("span", { class: "chip ok" }, "Submitted") : st === "stale" ? h("span", { class: "chip st" }, "Edited since submitted") : h("span", { class: "chip" }, "Not submitted");
    const d = h("details", { class: "fs" }, h("summary", {}, `${i + 1}. ${s.title}`, chip)) as HTMLDetailsElement;
    d.open = open.has(s.key);
    d.addEventListener("toggle", () => { if (d.open) open.add(s.key); else open.delete(s.key); });
    const hd = s.head;
    d.append(h("div", { class: "who" }, [hd.codes, hd.who].filter(Boolean).join(" · ")), hd.intro ? h("div", { class: "intro" }, hd.intro) : "");
    for (const b of s.blocks) { if (!F.flowShown(def, rec, b)) continue; d.append(block(def, rec, b, ix)); }
    if (can) {
      const miss = F.missingRequired(def, rec, s);
      const box = h("input", { type: "checkbox", checked: st === "submitted" || undefined, disabled: (st === "submitted" || busy) || undefined,
        title: miss.length ? "Fill in: " + miss.join(", ") : "Confirms this section was checked and its values are correct, and saves the flow" }) as HTMLInputElement;
      box.addEventListener("change", () => { if (box.checked) void submit(s.key); });
      d.append(h("label", { class: "subrow" }, box,
        h("span", {}, h("b", {}, "Submitted"), " — I checked this section and the values are correct.",
          st === "stale" ? h("span", { class: "err" }, " Edited since it was submitted; submit it again.") : "",
          miss.length && st !== "submitted" ? h("span", { class: "hint" }, ` Required: ${miss.join(", ")}.`) : "",
          st === "submitted" ? h("span", { class: "hint" }, ` ${rec.sub[s.key]!.at.slice(0, 16).replace("T", " ")} by ${rec.sub[s.key]!.by}. Change a value to reopen it.`) : "")));
    }
    return d;
  }

  function block(def: F.FlowDef, rec: F.FlowRecord, b: F.FlowBlock, ix: ModelIndex | null): HTMLElement {
    if (b.t === "group") return h("div", { class: "grp" + (b.crit ? " crit" : "") }, h("b", {}, b.label ?? ""), b.caption ? h("div", { class: "cap" }, b.caption) : "", ...(b.fields ?? []).map((f) => field(def, rec, f, ix)));
    if (b.t === "table") return table(rec, b);
    if (b.t === "yaml") return h("div", { class: "grp" }, h("b", {}, b.title ?? "YAML"), b.note ? h("div", { class: "cap" }, b.note) : "",
      h("div", { class: "yaml" }, ...F.firmwareYaml(def, rec).map((l) => h("div", { class: l.changed ? "c" : "" }, l.line, l.changed && l.was ? h("span", { class: "was" }, `   # was ${l.was}`) : ""))));
    if (b.t === "canvas") { const g = F.planGroups(rec, b); return h("div", { class: "grp" }, h("b", {}, b.title ?? "Plan"), b.note ? h("div", { class: "cap" }, b.note) : "",
      g.length ? h("ul", {}, ...g.map((x) => h("li", {}, h("b", {}, x.group + ": "), x.items.join(", ")))) : h("div", { class: "hint" }, "No test cases included yet."),
      h("div", { class: "hint" }, "The canvas file itself is not written in this version; the grouping is saved in the flow record.")); }
    return h("div", {});
  }

  function field(def: F.FlowDef, rec: F.FlowRecord, f: F.FlowField, ix: ModelIndex | null): HTMLElement {
    const lab = h("label", { class: "fl" }, f.label, f.req ? h("span", { class: "req" }, " *") : "", f.tag ? h("span", { class: "tag" }, f.tag) : "");
    if (f.kind === "read") { const v = f.dyn ? F.dynValue(f.dyn, ix, rec, def) : f.v ?? ""; return h("div", {}, lab, h("div", { class: "ro" }, v || "—")); }
    const cur = rec.vals[f.id] ?? "", base = rec.base[f.id], chg = base !== undefined && cur !== base;
    let inp: HTMLElement;
    if (f.kind === "select") inp = h("select", { "aria-label": f.label }, ...F.fieldOptions(f, rec).map((o) => h("option", { value: o, selected: o === cur || undefined }, o || "—")));
    else if (f.kind === "area") inp = h("textarea", { "aria-label": f.label, placeholder: f.ph ?? "" });
    else inp = h("input", { type: "text", "aria-label": f.label, placeholder: f.ph ?? "" });
    if (f.kind !== "select") (inp as HTMLInputElement).value = cur;
    inp.addEventListener("input", () => { rec.vals[f.id] = (inp as HTMLInputElement).value; });
    inp.addEventListener("change", () => { rec.vals[f.id] = (inp as HTMLInputElement).value; note = ""; redraw(); });
    return h("div", { class: chg ? "chg" : "" }, lab, inp, chg ? h("div", { class: "was" }, `${def.wasLabel} ${base || "—"}`) : "", f.hint ? h("div", { class: "hint" }, f.hint) : "");
  }

  function table(rec: F.FlowRecord, b: F.FlowBlock): HTMLElement {
    const cols = b.cols ?? [], id = b.id ?? "", fixed = id === "files", rows = fixed ? (b.rows ?? []) : (rec.rows[id] ??= []);
    const t = h("table", {}, h("thead", {}, h("tr", {}, ...cols.map((c) => h("th", {}, c.label)), fixed ? null : h("th", {}, ""))));
    const tb = h("tbody", {});
    rows.forEach((r, ri) => {
      tb.append(h("tr", {}, ...cols.map((c) => {
        if (fixed || !c.edit) return h("td", {}, r[c.k] ?? "");
        let inp: HTMLElement;
        if (c.opts) inp = h("select", { "aria-label": c.label }, ...[...new Set([...(c.opts), r[c.k] ?? ""])].map((o) => h("option", { value: o, selected: o === (r[c.k] ?? "") || undefined }, o || "—")));
        else { inp = h("input", { type: "text", "aria-label": c.label }); (inp as HTMLInputElement).value = r[c.k] ?? ""; }
        inp.addEventListener("input", () => { r[c.k] = (inp as HTMLInputElement).value; });
        inp.addEventListener("change", () => { r[c.k] = (inp as HTMLInputElement).value; redraw(); });
        return h("td", {}, inp);
      }), fixed ? null : h("td", {}, h("button", { class: "sm", title: "Remove this row", onclick: () => { rows.splice(ri, 1); redraw(); } }, "×"))));
    });
    if (!rows.length) tb.append(h("tr", {}, h("td", { colspan: String(cols.length + 1), class: "hint" }, b.src && b.src !== "files" ? "Nothing found in the vault for the selected note. Add rows by hand if needed." : "No rows yet.")));
    t.append(tb);
    return h("div", { class: "grp" }, h("b", {}, b.title ?? ""), b.note ? h("div", { class: "cap" }, b.note) : "", h("div", { class: "tbl" }, t),
      fixed ? null : h("button", { class: "sm", onclick: () => { rows.push(Object.fromEntries(cols.map((c) => [c.k, c.opts ? c.opts[0] ?? "" : ""]))); redraw(); } }, "Add row"));
  }

  async function submit(key: string): Promise<void> {
    if (!CUR || busy) return;
    const { def } = CUR, before = CUR.rec;
    const r = F.submitSection(def, before, key, ctx.host.author() || before.author, new Date());
    if ("error" in r) { note = r.error; redraw(); return; }
    const plan = F.planSaveFlow(def, r.rec, ctx.host.files());
    if (plan.problems.length) { note = plan.problems[0]!; redraw(); return; }
    busy = true; redraw();
    try {
      const res = await ctx.host.applyPlan(plan);
      CUR = { def, rec: r.rec }; note = "";
      const flowId = r.rec.flowId;
      ctx.done(`${res.message} Section submitted.`, async () => {
        const m = await res.undo();
        const back = ctx.host.files().get(F.flowPath(flowId));
        const prev = back ? F.parseFlowNote(back) : null;
        if (CUR && CUR.rec.flowId === flowId) CUR = prev ? { def, rec: prev } : { def, rec: before };
        return m;
      });
    } catch (e) { note = "Could not save: " + String((e as Error)?.message ?? e); }
    finally { busy = false; redraw(); }
  }

  redraw();
  (root as HTMLElement & { refresh?: () => void }).refresh = redraw;
  return root;
}
