/* The Edit lens (D-0030): add a relationship from the selected note, add an element, set a requirement's text.
 * Choices are drop-downs; targets are picked from a searchable, folder-grouped browser. Every edit is previewed as a
 * diff and applied only on a click; the host writes the files and returns a way back (WKB-006). Plain DOM, vault strings as text. */
import { h } from "./ui.ts";
import type { Child } from "./ui.ts";
import type { EdgeRef, ModelIndex, Note } from "./index.ts";
import { incoming, outgoing } from "./index.ts";
import * as ED from "./edit.ts";
import * as RL from "./edit_rel.ts";
import * as PT from "./edit_port.ts";
import { ED_HELP } from "./edit_help.ts";

export interface EditHost {
  files(): Map<string, string>;
  classes(): ED.EdClasses;
  author(): string;
  folders(): string[];
  applyPlan(plan: ED.EditPlan): Promise<{ message: string; undo: () => Promise<string> }>;
}
export interface EditCtx { getIx(): ModelIndex; getSel(): string; host: EditHost; done(message: string, undo: (() => Promise<string>) | null): void; open(path: string): void }
/** The relationship the Edit lens is working on (chosen from a table, the canvas or the list). */
export function setEditRef(ref: EdgeRef | null): void { SAVED.ref = ref; if (ref) SAVED.mode = "manage"; }

export const EDIT_STYLE = `
.mded .tabs{display:flex;gap:4px;margin:0 0 8px}.mded .tabs button{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:999px;background:var(--bg2);color:var(--fg);cursor:pointer}.mded .tabs button[aria-pressed=true]{border-color:var(--acc);font-weight:600}
.mded label.f{display:block;margin:6px 0 2px;font-size:12px;color:var(--mut)}.mded select,.mded input[type=text],.mded input[type=search],.mded textarea{width:100%;box-sizing:border-box}.mded textarea{min-height:80px}
.mded .pick{max-height:240px;overflow:auto;border:1px solid var(--line);border-radius:6px;margin-top:4px}.mded .pick summary{cursor:pointer;padding:2px 6px;background:var(--bg2);font-size:12px}
.mded .pick .it{padding:3px 8px;cursor:pointer;border-top:1px solid var(--line);font-size:12.5px}.mded .pick .it:hover{background:var(--bg2)}.mded .pick .it[aria-selected=true]{outline:2px solid var(--acc);outline-offset:-2px}
.mded .pick .it .sn{color:var(--mut);font-size:11.5px;white-space:normal}
.mded .diff{font-family:var(--font-monospace,monospace);font-size:11.5px;white-space:pre-wrap;border:1px solid var(--line);border-radius:6px;padding:4px 6px;margin:6px 0}.mded .diff .add{color:#1b7a3a}.mded .diff .del{color:#b3261e;text-decoration:line-through}
.mded .acts2{display:flex;gap:6px;margin:8px 0}
.mded .q{display:inline-block;width:16px;height:16px;line-height:14px;text-align:center;border:1px solid var(--line);border-radius:50%;font-size:11px;margin-left:6px;cursor:pointer;color:var(--mut);background:var(--bg2);padding:0}.mded .q:hover,.mded .q[aria-expanded=true]{border-color:var(--acc);color:var(--fg)}
.mded .hlp{border:1px solid var(--acc);border-radius:6px;padding:6px 8px;margin:4px 0;font-size:12px;background:var(--bg2);white-space:normal}.mded .hlp b{display:block}.mded .hlp ul{margin:4px 0 4px 16px;padding:0}
.mded table.rl{width:100%;font-size:12px;border-collapse:collapse}.mded table.rl td{padding:3px 4px;border-top:1px solid var(--line);vertical-align:top}
.mded .prop{display:flex;gap:4px;align-items:center;margin:4px 0}.mded .prop>label{min-width:84px;font-size:12px;color:var(--mut)}.mded .prop input[type=text],.mded .prop select{flex:1}

`;

type Mode = "manage" | "rel" | "ports" | "elem" | "text";
const SAVED: { mode: Mode; ref: EdgeRef | null; stale: boolean } = { mode: "manage", ref: null, stale: false };
/** A write or an undo changed the files: the next index refresh redraws the Edit lens so its lists show the new state. */
export function markEditStale(): void { SAVED.stale = true; }
/** Called by the panel when a rebuilt index arrives; redraws only after our own write, so a form being filled is not lost to an unrelated rebuild. */
export function editRefresh(el: HTMLElement): void { (el as unknown as { mdRefresh?: () => void }).mdRefresh?.(); }
const PORT_SAVED: { kind: PT.PortKind | ""; editing: string; spec: PT.PortSpec | null } = { kind: "", editing: "", spec: null };                       // survives redraws of the panel

export function editView(c: EditCtx): HTMLElement {
  const host = c.host;
  let ix = c.getIx(), from = ix.notes.get(c.getSel());                         // refreshed by render(): the form a person is filling survives index rebuilds
  const box = h("div", { class: "mded" });
  const tabs = h("div", { class: "tabs" });
  const body = h("div", {});
  const setMode = (m: Mode): void => { SAVED.mode = m; render(); };
  for (const [m, label] of [["manage", "Relationships"], ["rel", "Add relationship"], ["ports", "Ports"], ["elem", "Add element"], ["text", "Requirement text"]] as Array<[Mode, string]>) tabs.append(h("button", { "aria-pressed": SAVED.mode === m, onclick: () => setMode(m) }, label));
  box.append(tabs, body);
  (box as unknown as { mdRefresh: () => void }).mdRefresh = (): void => { if (!SAVED.stale) return; SAVED.stale = false; ix = c.getIx(); from = ix.notes.get(c.getSel()); listRefresh?.(); };
  let listRefresh: (() => void) | null = null;                                 // redraws only a list, never a form being filled
  box.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Escape") { box.querySelectorAll(".hlp").forEach((x) => x.remove()); box.querySelectorAll(".q[aria-expanded=true]").forEach((x) => x.setAttribute("aria-expanded", "false")); } });

  /* ---- shared: preview + apply ---- */
  const previewBox = h("div", {}), applyRow = h("div", { class: "acts2" });
  let plan: ED.EditPlan | null = null;
  const showPlan = (p: ED.EditPlan | null): void => {
    plan = p; previewBox.replaceChildren(); applyRow.replaceChildren();
    if (!p) return;
    if (p.problems.length) { previewBox.append(h("div", { class: "callout flagConflict" }, h("b", {}, "Not possible"), ...p.problems.map((x) => h("div", {}, x)))); return; }
    previewBox.append(h("div", { class: "mut", style: "font-size:12px" }, p.summary));
    for (const w of p.writes) {
      const d = ED.edDiff(w.before, w.after);
      previewBox.append(h("div", { class: "mut", style: "font-size:11.5px;margin-top:4px" }, (w.before === null ? "New file: " : "Changes: ") + w.path),
        h("div", { class: "diff" }, ...d.removed.map((l) => h("div", { class: "del" }, l || " ")), ...d.added.map((l) => h("div", { class: "add" }, l || " "))));
    }
    applyRow.append(h("button", { class: "sm pri", onclick: async (e: Event) => {
      const b = e.target as HTMLButtonElement; b.disabled = true; SAVED.stale = true;
      try { const r = await host.applyPlan(p); if (SAVED.mode === "manage") SAVED.ref = null; if (SAVED.mode === "ports") { PORT_SAVED.editing = ""; PORT_SAVED.spec = null; } c.done(r.message, r.undo); if (p.writes[0]?.before === null) c.open(p.writes[0].path); }
      catch (err) { b.disabled = false; showPlan({ summary: "", writes: [], problems: [String((err as Error)?.message ?? err)] }); }
    } }, "Apply"), h("button", { class: "sm", onclick: () => showPlan(null) }, "Cancel"));
  };
  /* ---- "?" help: a short popover from bundled text, one open at a time ---- */
  const helpBtn = (topic: string | (() => string)): HTMLElement => {
    const key = (): string => (typeof topic === "function" ? topic() : topic);
    const b = h("button", { class: "q", type: "button", "aria-label": "What is this?", "aria-expanded": "false", title: "What is this?" }, "?");
    b.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const t = ED_HELP[key()];
      if (!t) return;
      const wasOpen = b.getAttribute("aria-expanded") === "true";
      box.querySelectorAll(".hlp").forEach((x) => x.remove());
      box.querySelectorAll(".q[aria-expanded=true]").forEach((x) => x.setAttribute("aria-expanded", "false"));
      if (wasOpen) return;
      b.setAttribute("aria-expanded", "true");
      const path = t.note ? `99_System/04_Language/${t.note}.md` : "", have = !!path && host.files().has(path);
      const pop = h("div", { class: "hlp", role: "note" }, h("b", {}, t.title), h("div", {}, t.what), t.options?.length ? h("ul", {}, ...t.options.map((o) => h("li", {}, o))) : null,
        have ? h("a", { href: "#", class: "lnk", onclick: (ev: Event) => { ev.preventDefault(); c.open(path); } }, `More: ${t.note}`) : null);
      (b.closest(".prop") ?? b.closest("label") ?? b).after(pop);
    });
    return b;
  };
  const field = (label: string, el: HTMLElement, topic: string | (() => string) = ""): HTMLElement => h("div", { class: "hq" }, h("label", { class: "f" }, label, topic ? helpBtn(topic) : null), el);
  const opts = (vals: Array<[string, string]>, cur: string): Child[] => vals.map(([v, l]) => h("option", { value: v, selected: v === cur ? true : undefined }, l));

  /* ---- target browser: search, type filter, folder groups ---- */
  function picker(items: Note[], onPick: (n: Note) => void, initial: string): { el: HTMLElement; value(): string } {
    let q = "", type = "", chosen = initial;
    const list = h("div", { class: "pick", role: "listbox" }), types = [...new Set(items.map((n) => n.type))].sort();
    const search = h("input", { type: "search", placeholder: "Search name, id or text…", "aria-label": "Search targets" }) as HTMLInputElement;
    const tsel = h("select", { "aria-label": "Filter by type" }, h("option", { value: "" }, "all types"), ...types.map((t) => h("option", { value: t }, t))) as HTMLSelectElement;
    const hay = (n: Note): string => `${n.title} ${n.id} ${n.type} ${n.subtype} ${n.def?.doc ?? ""}`.toLowerCase();
    const draw = (): void => {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean), hits = items.filter((n) => (!type || n.type === type) && words.every((w) => hay(n).includes(w)));
      const groups = new Map<string, Note[]>(); for (const n of hits) (groups.get(n.folder) ?? groups.set(n.folder, []).get(n.folder)!).push(n);
      list.replaceChildren();
      if (!hits.length) { list.append(h("div", { class: "empty", style: "padding:8px" }, "No eligible notes match.")); return; }
      let shown = 0;
      for (const [folder, ns] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
        if (shown > 300) { list.append(h("div", { class: "more" }, "… refine the search to see more.")); break; }
        const det = h("details", {}, h("summary", {}, `${folder || "(vault root)"} · ${ns.length}`));
        if (words.length || type || groups.size === 1 || ns.some((n) => n.path === chosen)) det.setAttribute("open", "");
        for (const n of ns.sort((a, b) => a.title.localeCompare(b.title)).slice(0, 100)) {
          shown++;
          const txt = n.def?.doc ? n.def.doc.replace(/\s+/g, " ") : "";
          det.append(h("div", { class: "it", role: "option", "aria-selected": n.path === chosen, onclick: () => { chosen = n.path; onPick(n); draw(); } },
            h("b", {}, n.title), " ", h("span", { class: "mut" }, `${n.id} · ${n.type}${n.subtype ? "/" + n.subtype : ""}`), txt ? h("div", { class: "sn" }, txt.length > 220 ? txt.slice(0, 220) + " …" : txt) : null));
        }
        list.append(det);
      }
    };
    search.addEventListener("input", () => { q = search.value; draw(); });
    tsel.addEventListener("change", () => { type = tsel.value; draw(); });
    draw();
    return { el: h("div", {}, h("div", { style: "display:flex;gap:4px" }, search, tsel), list), value: () => chosen };
  }

  /* ---- add relationship ---- */
  function relView(): HTMLElement {
    const v = h("div", {});
    if (!from) return h("div", { class: "empty", style: "padding:12px 0" }, "Open a model note in Obsidian: the relationship is added to it.");
    const rels = ED.edRelsFor(from);
    if (!rels.length) return h("div", { class: "empty", style: "padding:12px 0" }, `"${from.title}" has no SysML definition to add relationships to.`);
    let rel = rels[0]!, target: Note | null = null, usageKind = "", dir = "";
    const name = h("input", { type: "text", placeholder: "default: from the target's name" }) as HTMLInputElement, mult = h("input", { type: "text", placeholder: "e.g. 3 or 0..1 (default 1)" }) as HTMLInputElement;
    const help = h("div", { class: "mut", style: "font-size:12px;margin:2px 0" }), pickBox = h("div", {}), extra = h("div", {}), kindSel = h("select", { "aria-label": "Relationship" }) as HTMLSelectElement;
    const compute = (): void => {
      if (!target) { showPlan({ summary: "", writes: [], problems: ["Pick a target first."] }); return; }
      showPlan(ED.planAddRelationship(ix, host.files(), { rel: rel.id, from: from.path, to: target.path, name: name.value, mult: mult.value, usageKind, dir }));
    };
    const drawExtra = (): void => {
      extra.replaceChildren();
      if (rel.inputs.includes("name")) extra.append(field("Name of the usage", name, "name"));
      if (rel.inputs.includes("mult")) extra.append(field("Quantity (multiplicity)", mult, "mult"));
      if (rel.inputs.includes("dir") && target && ED.edUsageKinds(target)[0] === "item") extra.append(field("Flow direction", h("select", { "aria-label": "Direction", onchange: (e: Event) => { dir = (e.target as HTMLSelectElement).value; } }, ...opts([["", "(none)"], ["in", "in"], ["out", "out"], ["inout", "inout"]], dir)), "dir"));
      if (rel.id === "owns" && target && ED.edUsageKinds(target).length > 1) extra.append(field("Usage kind", h("select", { onchange: (e: Event) => { usageKind = (e.target as HTMLSelectElement).value; } }, ...opts(ED.edUsageKinds(target).map((k) => [k, k]), usageKind)), "usageKind"));
    };
    const drawPicker = (): void => {
      target = null; showPlan(null); drawExtra();
      const items = ED.edTargets(ix, rel, from);
      pickBox.replaceChildren(items.length ? picker(items, (n) => { target = n; usageKind = ED.edUsageKinds(n)[0] ?? ""; drawExtra(); showPlan(null); }, "").el : h("div", { class: "empty", style: "padding:8px" }, "No eligible target in the vault."));
    };
    kindSel.append(...opts(rels.map((r) => [r.id, r.label]), rel.id));
    kindSel.addEventListener("change", () => { rel = rels.find((r) => r.id === kindSel.value)!; help.textContent = rel.help; drawPicker(); });
    help.textContent = rel.help;
    v.append(h("div", {}, h("b", {}, from.title), " ", h("span", { class: "mut" }, `${from.id} · ${ED.edRelsFor(from).length} relationship kinds`)), field("Relationship", kindSel, () => rel.id), help, field("Target", pickBox, "target"), extra, h("div", { class: "acts2" }, h("button", { class: "sm", onclick: compute }, "Preview")), previewBox, applyRow);
    drawPicker();
    return v;
  }


  /* ---- ports (D-0033): port features, ports, interface ends, connections, flows, bindings ---- */
  function portsView(): HTMLElement {
    if (!from?.def) return h("div", { class: "empty", style: "padding:12px 0" }, "Open a part, port or interface definition in Obsidian to work on its ports.");
    const d = from.def, kinds = PT.edPortKindsFor(from), v = h("div", {});
    if (!kinds.length) return h("div", { class: "empty", style: "padding:12px 0" }, `A ${d.keyword} has no ports or connections. Open a part, item, port or interface definition.`);
    v.append(h("div", {}, h("b", {}, from.title), " ", h("span", { class: "mut" }, `${from.id} · ${d.keyword}`)));
    const titleOfSym = (sym: string | undefined): string => (sym ? ix.notes.get(ix.bySymbol.get(sym) ?? "")?.title ?? sym : "");
    /* what is there now */
    const cur = h("div", {});
    const drawCur = (): void => {
    const rows: Array<{ head: string; what: string; text: string }> = [];
    const d = from?.def; if (!d) return;
    for (const u of d.usages) { const k = PT.ED_PORT_OWNERS.feature.includes(d.keyword) ? "feature" : u.end ? "end" : u.kind === "port" ? "port" : ""; if (k) rows.push({ head: u.head, what: PT.ED_PORT_LABEL[k as PT.PortKind], text: u.head.replace(/OBJ_\d+::|[A-Z]+_\d+::/g, "") }); }
    for (const s of d.stmts) if (s.kind === "connect" || s.kind === "flow" || s.kind === "bind") rows.push({ head: s.text, what: PT.ED_PORT_LABEL[s.kind], text: s.text.replace(/[A-Z]+_\d+::/g, "") });
    cur.replaceChildren();
    if (!rows.length) cur.append(h("div", { class: "empty", style: "padding:6px 0" }, "None yet."));
    else cur.append(h("table", { class: "rl" }, h("tbody", {}, ...rows.map((r) => h("tr", {}, h("td", {}, h("span", { class: "tag k" }, r.what)), h("td", {}, h("code", {}, r.text)),
      h("td", { style: "white-space:nowrap" },
        h("button", { class: "sm", onclick: () => { const sp = PT.edSpecOfMember(ix, from!.path, r.head); if (!sp) { showPlan({ summary: "", writes: [], problems: ["This member is not edited here; change it in the note."] }); return; } PORT_SAVED.kind = sp.kind; PORT_SAVED.editing = r.head; PORT_SAVED.spec = sp; render(); } }, "Edit"), " ",
        h("button", { class: "sm", onclick: () => showPlan(PT.planPortRemove(ix, host.files(), from!.path, r.head)) }, "Remove")))))));
    };
    listRefresh = drawCur; drawCur();
    v.append(cur);
    /* add / edit */
    const kind = (PORT_SAVED.kind && kinds.includes(PORT_SAVED.kind) ? PORT_SAVED.kind : "") as PT.PortKind | "";
    const kindSel = h("select", { "aria-label": "Add" }, h("option", { value: "" }, PORT_SAVED.editing ? `Editing: ${PT.ED_PORT_LABEL[kind as PT.PortKind]}` : "Add…"), ...kinds.map((k) => h("option", { value: k, selected: k === kind ? true : undefined }, PT.ED_PORT_LABEL[k]))) as HTMLSelectElement;
    kindSel.addEventListener("change", () => { PORT_SAVED.kind = kindSel.value as PT.PortKind | ""; PORT_SAVED.editing = ""; PORT_SAVED.spec = null; render(); });
    v.append(h("div", { style: "margin-top:8px" }, kindSel));
    if (!kind) { v.append(previewBox, applyRow); return v; }
    const sp: PT.PortSpec = PORT_SAVED.spec ?? { kind, name: "", memberKind: kind === "feature" ? "item" : kind === "port" ? "port" : "", form: "plain" };
    sp.kind = kind;
    const editing = PORT_SAVED.editing;
    const txt = (val: string, on: (x: string) => void, ph = "", list = ""): HTMLInputElement => { const i = h("input", { type: "text", placeholder: ph, ...(list ? { list } : {}) }) as HTMLInputElement; i.value = val; i.addEventListener("input", () => { on(i.value); showPlan(null); }); return i; };
    const chk = (val: boolean, on: (x: boolean) => void): HTMLInputElement => h("input", { type: "checkbox", checked: val, onchange: (e: Event) => { on((e.target as HTMLInputElement).checked); showPlan(null); } }) as HTMLInputElement;
    const sel = (vals: Array<[string, string]>, cur2: string, on: (x: string) => void, label: string, redraw = false): HTMLSelectElement =>
      h("select", { "aria-label": label, onchange: (e: Event) => { on((e.target as HTMLSelectElement).value); showPlan(null); if (redraw) drawForm(); } }, ...opts(vals, cur2)) as HTMLSelectElement;
    /* a type chosen with the searchable browser; `allowed` are the definition keywords on offer */
    const typePick = (label: string, topic: string, allowed: string[], get: () => string | undefined, set: (x: string) => void, free: boolean): HTMLElement => {
      const line = h("div", {}), items = [...ix.notes.values()].filter((n) => n.def && allowed.includes(n.def.keyword));
      const show = (): void => { const t = get() ?? ""; line.replaceChildren(...[h("b", {}, t ? titleOfSym(t) : "(none)"), " ", t ? h("button", { class: "sm", type: "button", onclick: () => { set(""); show(); showPlan(null); } }, "Clear") : null].filter((x): x is HTMLElement | string => x !== null)); };
      show();
      const det = h("details", {}, h("summary", {}, "Choose…"), items.length ? picker(items, (n) => { set(n.def!.symbol); show(); showPlan(null); }, ix.bySymbol.get(get() ?? "") ?? "").el : h("div", { class: "empty", style: "padding:6px" }, "No eligible notes."));
      const wrap = h("div", {}, line, det);
      if (free) wrap.append(h("div", { class: "mut", style: "font-size:12px;margin-top:4px" }, "or a library type, such as ISQ::VoltageValue"), txt(ix.bySymbol.has(get() ?? "") ? "" : get() ?? "", (x) => { set(x.trim()); }, "Qualified name"));
      return field(label, wrap, topic);
    };
    const form = h("div", {}), drawForm = (): void => {
      form.replaceChildren();
      const pathList = h("datalist", { id: "mded-paths" });
      const wantPorts = sp.kind === "connect" && sp.form === "interface";
      for (const c of PT.edFeaturePaths(ix, d)) if (!c.kind.startsWith("end ") || d.keyword === "interface def") if (!wantPorts || c.kind.includes("port")) pathList.append(h("option", { value: c.path }, `${c.kind}${c.type ? " : " + c.type : ""}${c.dir ? " · " + c.dir : ""}`));
      if (sp.kind === "feature" || sp.kind === "port" || sp.kind === "end") {
        const mk = sp.kind === "feature" ? sp.memberKind ?? "item" : sp.kind === "port" ? "port" : "end";
        if (sp.kind === "feature") form.append(field("Feature", sel([["item", "item"], ["attribute", "attribute"], ["port", "port (nested)"]], mk, (x) => { sp.memberKind = x; if (x === "port") sp.dir = ""; }, "Feature kind", true), "pMember"));
        form.append(field("Name", txt(sp.name, (x) => { sp.name = x; }, "e.g. dcOut"), "name"));
        if (mk === "item" || mk === "attribute") form.append(field("Direction", sel([["", "(none)"], ["in", "in"], ["out", "out"], ["inout", "inout"]], sp.dir ?? "", (x) => { sp.dir = x; }, "Direction"), "pDir"));
        form.append(typePick(mk === "item" ? "Item type" : mk === "attribute" ? "Attribute type" : "Port definition", "pType", mk === "item" ? ["item def", "part def"] : mk === "attribute" ? ["item def", "part def", "port def"] : ["port def"], () => sp.type, (x) => { sp.type = x; }, mk === "attribute"));
        if (mk === "port" || mk === "end") form.append(field("Conjugated (~)", chk(!!sp.conj, (x) => { sp.conj = x; }), "conj"));
        form.append(field("Quantity (multiplicity)", txt(sp.mult ?? "", (x) => { sp.mult = x; }, "e.g. 2 or 0..1 (default 1)"), "mult"),
          field("Ordered", chk(!!sp.ordered, (x) => { sp.ordered = x; }), "ordered"), field("Nonunique", chk(!!sp.nonunique, (x) => { sp.nonunique = x; }), "nonunique"));
        if (sp.kind === "port") form.append(field("Reference port", chk(!!sp.ref, (x) => { sp.ref = x; }), "pRef"));
        return;
      }
      form.append(pathList);
      const ends = (): string[] => sp.def ? (ix.notes.get(ix.bySymbol.get(sp.def) ?? "")?.def?.usages.filter((u) => u.end).map((u) => u.name) ?? []) : [];
      if (sp.kind === "connect") {
        form.append(field("Kind", sel([["plain", "Plain: connect a to b"], ["connection", "Connection"], ["interface", "Interface"]], sp.form ?? "plain", (x) => { sp.form = x; }, "Kind of connection", true), "cForm"));
        if (sp.form !== "plain") {
          form.append(field("Name (optional)", txt(sp.name, (x) => { sp.name = x; }, "e.g. powerLink"), "name"));
          form.append(typePick(sp.form === "interface" ? "Interface definition" : "Interface or connection definition", "cDef", sp.form === "interface" ? ["interface def"] : ["interface def", "connection def"], () => sp.def, (x) => { sp.def = x; sp.endA = ""; sp.endB = ""; drawForm(); }, false));
        }
      } else if (sp.kind === "flow") {
        form.append(field("Name (optional)", txt(sp.name, (x) => { sp.name = x; }, "e.g. powerFlow"), "name"), typePick("Item carried (optional)", "fItem", ["item def", "part def"], () => sp.item, (x) => { sp.item = x; }, false));
      }
      const ph = d.keyword === "interface def" ? "e.g. supplier.current" : "e.g. charger.dcOut";
      form.append(field(sp.kind === "flow" ? "From (out)" : "First", txt(sp.a ?? "", (x) => { sp.a = x.trim(); }, ph, "mded-paths"), sp.kind === "bind" ? "bind" : sp.kind === "flow" ? "fFlow" : "cPath"),
        field(sp.kind === "flow" ? "To (in)" : "Second", txt(sp.b ?? "", (x) => { sp.b = x.trim(); }, ph, "mded-paths"), sp.kind === "bind" ? "bind" : sp.kind === "flow" ? "fFlow" : "cPath"));
      if (sp.kind === "connect" && sp.form !== "plain" && sp.def && ends().length) {
        form.append(field("First port plays end", sel([["", "(take the definition's ends in order)"], ...ends().map((e): [string, string] => [e, e])], sp.endA ?? "", (x) => { sp.endA = x; if (x && !sp.endB) { sp.endB = ends().find((e) => e !== x) ?? ""; drawForm(); } }, "First end"), "cEnd"),
          field("Second port plays end", sel([["", "(in order)"], ...ends().map((e): [string, string] => [e, e])], sp.endB ?? "", (x) => { sp.endB = x; }, "Second end"), "cEnd"));
      }
    };
    drawForm();
    v.append(h("div", { style: "margin-top:6px" }, h("b", {}, editing ? "Change" : "New " + PT.ED_PORT_LABEL[kind].toLowerCase())), form,
      h("div", { class: "acts2" }, h("button", { class: "sm pri", onclick: () => showPlan(editing ? PT.planPortReplace(ix, host.files(), from!.path, editing, sp) : PT.planPortAdd(ix, host.files(), from!.path, sp)) }, "Preview"),
        h("button", { class: "sm", onclick: () => { PORT_SAVED.kind = ""; PORT_SAVED.editing = ""; PORT_SAVED.spec = null; render(); } }, "Done")), previewBox, applyRow);
    return v;
  }

  /* ---- add element ---- */
  function elemView(): HTMLElement {
    const kinds = ED.edElementKinds(host.classes());
    let type = kinds.find((k) => k.type === "Object")?.type ?? kinds[0]!.type, subtype = "";
    const cur = (): { type: string; subtypes: string[]; keyword: string | null } => kinds.find((k) => k.type === type)!;
    const title = h("input", { type: "text", placeholder: "Name" }) as HTMLInputElement, text = h("textarea", { placeholder: "Requirement text, or a short description" }) as HTMLTextAreaElement;
    const folder = h("input", { type: "text", list: "mded-folders", placeholder: "Folder (type to search, or a new path)" }) as HTMLInputElement;
    folder.value = from?.folder ?? "";
    const dl = h("datalist", { id: "mded-folders" }, ...host.folders().map((f) => h("option", { value: f })));
    const subWrap = h("div", {}), hint = h("div", { class: "mut", style: "font-size:12px" });
    const drawSub = (): void => {
      const k = cur(); subtype = k.subtypes.includes(subtype) ? subtype : k.subtypes[0] ?? "";
      subWrap.replaceChildren(k.subtypes.length ? field("Subtype", h("select", { "aria-label": "Subtype", onchange: (e: Event) => { subtype = (e.target as HTMLSelectElement).value; drawHint(); } }, ...opts(k.subtypes.map((s) => [s, s]), subtype))) : "");
      drawHint(); showPlan(null);
    };
    const drawHint = (): void => { const kw = ED.edKeyword(type, subtype); hint.textContent = kw ? `Written as a SysML \`${kw}\`.${kw === "requirement def" ? " The text becomes its doc comment." : ""}` : "This class has no SysML form: a plain note."; };
    const typeSel = h("select", { "aria-label": "Class", onchange: (e: Event) => { type = (e.target as HTMLSelectElement).value; drawSub(); } }, ...opts(kinds.map((k) => [k.type, k.type]), type));
    drawSub();
    const compute = (): void => showPlan(ED.planAddElement(ix, host.classes(), { type, subtype, title: title.value, folder: folder.value, text: text.value, author: host.author() }));
    return h("div", {}, field("Class", typeSel), subWrap, hint, field("Name", title), field("Text", text), field("Folder", folder), dl, h("div", { class: "acts2" }, h("button", { class: "sm", onclick: compute }, "Preview")), previewBox, applyRow);
  }

  /* ---- requirement text ---- */
  function textView(): HTMLElement {
    if (!from || from.def?.keyword !== "requirement def") return h("div", { class: "empty", style: "padding:12px 0" }, "Open a requirement note in Obsidian to edit its text.");
    const ta = h("textarea", { "aria-label": "Requirement text", style: "min-height:140px" }) as HTMLTextAreaElement;
    ta.value = from.def.doc ?? "";
    return h("div", {}, h("div", {}, h("b", {}, from.title), " ", h("span", { class: "mut" }, `${from.id} · ${from.subtype}`)), field("Text", ta),
      h("div", { class: "acts2" }, h("button", { class: "sm", onclick: () => showPlan(ED.planSetRequirementText(ix, host.files(), from.path, ta.value)) }, "Preview")), previewBox, applyRow);
  }

  /* ---- relationships of the selected note: change, add properties, remove ---- */
  const relLabel = (id: string): string => ED.ED_RELS.find((r) => r.id === id)?.label ?? id;
  const titleOf = (path: string | null, fallback: string): string => (path ? ix.notes.get(path)?.title ?? fallback : fallback);
  function manageView(): HTMLElement {
    if (SAVED.ref) return formView(SAVED.ref);
    listRefresh = (): void => { if (SAVED.mode === "manage" && !SAVED.ref) render(); };
    if (!from) return h("div", { class: "empty", style: "padding:12px 0" }, "Open a model note in Obsidian to see its relationships, or choose Edit on a table row or a canvas line.");
    const seen = new Set<string>(), rows: Array<{ ref: EdgeRef; text: string; kind: string }> = [];
    for (const e of [...outgoing(ix, from.path), ...incoming(ix, from.path)]) {
      if (!e.ref || e.via !== "sysml") continue;
      const id = `${e.ref.owner}|${e.ref.kind}|${e.ref.key}`;
      if (seen.has(id)) continue; seen.add(id);
      const a = e.reverse ? e.toSymbol : titleOf(e.from, e.from), z = e.reverse ? titleOf(e.from, e.from) : e.to ? titleOf(e.to, e.toSymbol) : e.toSymbol + " (not in vault)";
      rows.push({ ref: e.ref, kind: e.kind, text: `${a} → ${z}${e.label ? "  (" + e.label + ")" : ""}` });
    }
    const v = h("div", {}, h("div", {}, h("b", {}, from.title), " ", h("span", { class: "mut" }, `${rows.length} SysML relationship${rows.length === 1 ? "" : "s"}`)));
    if (!rows.length) v.append(h("div", { class: "empty", style: "padding:8px 0" }, "None yet. Use Add relationship."));
    else v.append(h("table", { class: "rl" }, h("tbody", {}, ...rows.map((r) => h("tr", {}, h("td", {}, h("span", { class: "tag k" }, r.kind)), h("td", {}, r.text),
      h("td", { style: "white-space:nowrap" }, h("button", { class: "sm", onclick: () => { SAVED.ref = r.ref; render(); } }, "Edit"), " ",
        h("button", { class: "sm", title: "Preview removing this relationship", onclick: () => showPlan(RL.planRemoveRelationship(ix, host.files(), r.ref)) }, "Remove")))))));
    v.append(previewBox, applyRow);
    return v;
  }
  function formView(ref: EdgeRef): HTMLElement {
    const info = RL.edRelInfo(ix, ref), v = h("div", {});
    const back = h("button", { class: "sm", onclick: () => { SAVED.ref = null; render(); } }, "← All relationships");
    if (!info) { v.append(back, h("div", { class: "callout flagConflict" }, h("b", {}, "Relationship not found"), "It was changed or removed. Go back and pick it again.")); return v; }
    const owner = info.owner, f: RL.RelForm = { ...info.form, attrs: info.form.attrs.map((a) => ({ ...a })) }, relId = info.form.rel;
    const rel = info.rel;
    v.append(back, h("div", { style: "margin:6px 0" }, h("b", {}, owner.title), " ", h("span", { class: "tag k" }, relLabel(relId)), helpBtn(relId), " ", h("span", { class: "mut" }, ref.kind === "member" ? ref.key : `${ref.kind} ${ref.key}`)));
    const removeRow = h("div", { class: "acts2" }, h("button", { class: "sm", onclick: () => showPlan(RL.planRemoveRelationship(ix, host.files(), ref)) }, "Remove relationship"), helpBtn("remove"));
    if (info.why || !rel) { v.append(h("div", { class: "callout" }, info.why || "This kind of relationship is not edited here."), removeRow, previewBox, applyRow); return v; }

    /* target */
    const tNote = (): Note | undefined => ix.notes.get(f.target);
    const tLine = h("div", {}), tPick = h("details", {}, h("summary", {}, "Change target…"));
    const drawT = (): void => { tLine.replaceChildren(h("b", {}, tNote()?.title ?? "(not in vault)"), " ", h("span", { class: "mut" }, tNote() ? `${tNote()!.id} · ${tNote()!.type}` : "")); };
    const targets = ED.edTargets(ix, rel, owner);
    tPick.append(targets.length ? picker(targets, (n) => { f.target = n.path; if (relId === "owns") { const k = ED.edUsageKinds(n); if (!k.includes(f.usageKind)) f.usageKind = k[0] ?? f.usageKind; } drawT(); drawProps(); showPlan(null); }, f.target).el : h("div", { class: "empty" }, "No other eligible target."));
    drawT();
    v.append(field("Target", h("div", {}, tLine, tPick), "target"));

    /* dependency kind */
    if (RL.ED_DEP_KINDS.includes(relId)) v.append(field("Kind of dependency", h("select", { "aria-label": "Kind of dependency", onchange: (e: Event) => { f.depKind = (e.target as HTMLSelectElement).value; showPlan(null); } }, ...opts(RL.ED_DEP_KINDS.map((k) => [k, relLabel(k)]), f.depKind || relId)), "depKind"));

    /* properties: the ones set, an "Add property" list of the rest, and free attributes where allowed */
    const props = h("div", {});
    const shown = new Set<RL.PropId>();
    const initShown = (): void => { const P = RL.edPropsFor(relId, f.usageKind); for (const o of P.options) if (o === "name" || (o === "mult" && f.mult) || (o === "dir" && f.dir) || (o === "ordered" && f.ordered) || (o === "nonunique" && f.nonunique) || (o === "doc" && f.doc)) shown.add(o); };
    initShown();
    const LABEL: Record<RL.PropId, string> = { name: "Name", mult: "Quantity", dir: "Direction", ordered: "Ordered", nonunique: "Nonunique", doc: "Description" };
    const row = (label: string, topic: string, ctl: HTMLElement, remove?: () => void): HTMLElement =>
      h("div", { class: "prop" }, h("label", {}, label, topic ? helpBtn(topic) : null), ctl, remove ? h("button", { class: "sm", type: "button", "aria-label": `Remove ${label}`, title: "Remove this property", onclick: remove }, "×") : null);
    const txt = (val: string, on: (x: string) => void, ph = ""): HTMLInputElement => { const i = h("input", { type: "text", placeholder: ph }) as HTMLInputElement; i.value = val; i.addEventListener("input", () => { on(i.value); showPlan(null); }); return i; };
    function drawProps(): void {
      const P = RL.edPropsFor(relId, f.usageKind);
      for (const o of [...shown]) if (!P.options.includes(o)) shown.delete(o);
      props.replaceChildren();
      for (const o of P.options.filter((x) => shown.has(x))) {
        if (o === "name") props.append(row(LABEL.name, "name", txt(f.name, (x) => { f.name = x; })));
        else if (o === "mult") props.append(row(LABEL.mult, "mult", txt(f.mult, (x) => { f.mult = x; }, "3 or 0..1"), () => { f.mult = ""; shown.delete("mult"); drawProps(); showPlan(null); }));
        else if (o === "dir") props.append(row(LABEL.dir, "dir", h("select", { "aria-label": "Direction", onchange: (e: Event) => { f.dir = (e.target as HTMLSelectElement).value; showPlan(null); } }, ...opts([["", "(none)"], ["in", "in"], ["out", "out"], ["inout", "inout"]], f.dir)), () => { f.dir = ""; shown.delete("dir"); drawProps(); showPlan(null); }));
        else if (o === "ordered" || o === "nonunique") props.append(row(LABEL[o], o, h("input", { type: "checkbox", checked: f[o], onchange: (e: Event) => { f[o] = (e.target as HTMLInputElement).checked; showPlan(null); } }), () => { f[o] = false; shown.delete(o); drawProps(); showPlan(null); }));
        else { const ta = h("textarea", { "aria-label": "Description", style: "min-height:60px" }) as HTMLTextAreaElement; ta.value = f.doc; ta.addEventListener("input", () => { f.doc = ta.value; showPlan(null); }); props.append(row(LABEL.doc, "doc", ta, () => { f.doc = ""; shown.delete("doc"); drawProps(); showPlan(null); })); }
      }
      f.attrs.forEach((a, i) => props.append(row("Attribute", "custom", h("div", { style: "display:flex;gap:4px;flex:1" }, txt(a.name, (x) => { a.name = x; }, "name"), txt(a.value, (x) => { a.value = x; }, "value")), () => { f.attrs.splice(i, 1); drawProps(); showPlan(null); })));
      const avail = P.options.filter((x) => !shown.has(x));
      if (avail.length || P.custom) {
        const sel = h("select", { "aria-label": "Add property" }, h("option", { value: "" }, "Add property…"), ...avail.map((x) => h("option", { value: x }, LABEL[x])), ...(P.custom ? [h("option", { value: "@custom" }, "Other attribute…")] : [])) as HTMLSelectElement;
        sel.addEventListener("change", () => { const x = sel.value; if (x === "@custom") f.attrs.push({ name: "", value: "" }); else if (x) shown.add(x as RL.PropId); drawProps(); showPlan(null); });
        props.append(h("div", { class: "prop" }, h("label", {}, "Properties", helpBtn("custom")), sel));
      }
    }
    drawProps();
    v.append(h("div", { class: "mut", style: "font-size:12px;margin-top:8px" }, "Properties"), props);
    v.append(h("div", { class: "acts2" }, h("button", { class: "sm pri", onclick: () => showPlan(RL.planUpdateRelationship(ix, host.files(), ref, { ...f, attrs: f.attrs.filter((a) => a.name.trim() || a.value.trim()) })) }, "Preview changes"), removeRow), previewBox, applyRow);
    return v;
  }

  function render(): void {
    ix = c.getIx(); from = ix.notes.get(c.getSel());
    for (const [i, b] of Array.from(tabs.children).entries()) b.setAttribute("aria-pressed", String((["manage", "rel", "ports", "elem", "text"] as Mode[])[i] === SAVED.mode));
    plan = null; previewBox.replaceChildren(); applyRow.replaceChildren(); listRefresh = null;
    body.replaceChildren(SAVED.mode === "manage" ? manageView() : SAVED.mode === "rel" ? relView() : SAVED.mode === "ports" ? portsView() : SAVED.mode === "elem" ? elemView() : textView());
  }
  void plan;
  render();
  return box;
}
