/* The Workbench user interface. Plain DOM, no framework, no network. Every string from the vault goes in as text, never
 * as markup. Used unchanged by the standalone page and by the Obsidian plugin; the host supplies what differs. */
import { buildIndexAsync } from "./index.ts";
import type { ModelIndex, Note } from "./index.ts";
import * as V from "./views.ts";

export interface Host {
  /** Open the note in the host's own editor (Obsidian). Absent in the standalone page. */
  openNote?: (path: string) => void;
  classes?: Record<string, { prefix: string; subtype: string[] }>;
}
export interface App { setFiles(files: Map<string, string>): Promise<void>; select(path: string): void; index(): ModelIndex | null; destroy(): void }

type Child = Node | string | null | undefined | false;
function h(tag: string, attrs: Record<string, unknown> = {}, ...kids: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = String(v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v as EventListener);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of kids) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}
const svgNS = "http://www.w3.org/2000/svg";
function s(tag: string, attrs: Record<string, unknown> = {}, ...kids: Array<Node | string>): SVGElement {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of kids) el.append(c);
  return el;
}

export const STYLE = `
.mdw{--bg:var(--background-primary,#fff);--bg2:var(--background-secondary,#f4f5f7);--fg:var(--text-normal,#1d2330);--mut:var(--text-muted,#5b6475);--line:var(--background-modifier-border,#d7dbe3);--acc:var(--interactive-accent,#2557d6);--warn:#b25e00;--bad:#b3261e;--ok:#1b7a3a;
 font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg);background:var(--bg);display:grid;grid-template-columns:300px 1fr;grid-template-rows:auto 1fr;height:100%;min-height:520px}
@media (prefers-color-scheme:dark){.mdw:not(.obs){--bg:#14171d;--bg2:#1c2028;--fg:#e6e9ef;--mut:#9aa3b2;--line:#323846;--acc:#7da4ff;--warn:#f0a050;--bad:#ff8a80;--ok:#6fd08c}}
.mdw *{box-sizing:border-box}.mdw header{grid-column:1/3;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--bg2)}
.mdw header b{font-size:15px}.mdw .pill{border:1px solid var(--line);border-radius:999px;padding:1px 9px;font-size:12px;color:var(--mut)}.mdw .pill.warn{color:var(--warn);border-color:var(--warn)}.mdw .pill.ok{color:var(--ok);border-color:var(--ok)}.mdw .pill.bad{color:var(--bad);border-color:var(--bad)}
.mdw aside{border-right:1px solid var(--line);overflow:auto;padding:8px;background:var(--bg2)}.mdw main{overflow:auto;padding:0}
.mdw input,.mdw select,.mdw button{font:inherit;color:inherit;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:4px 8px}.mdw button{cursor:pointer}.mdw button:hover{border-color:var(--acc)}
.mdw aside input{width:100%;margin-bottom:8px}.mdw nav.tabs{display:flex;gap:2px;flex-wrap:wrap;padding:6px 10px 0;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
.mdw nav.tabs button{border:0;border-bottom:3px solid transparent;border-radius:0;background:none;padding:6px 10px;color:var(--mut)}.mdw nav.tabs button[aria-selected=true]{color:var(--fg);border-color:var(--acc);font-weight:600}.mdw nav.tabs button:disabled{opacity:.4;cursor:default}
.mdw .pane{padding:14px 16px 40px}.mdw h2{margin:0 0 8px;font-size:17px}.mdw h3{margin:18px 0 6px;font-size:14px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.mdw a.lnk{color:var(--acc);cursor:pointer;text-decoration:none}.mdw a.lnk:hover{text-decoration:underline}.mdw .mut{color:var(--mut)}.mdw .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}
.mdw table{border-collapse:collapse;width:100%}.mdw th,.mdw td{text-align:left;padding:4px 8px;border-bottom:1px solid var(--line);vertical-align:top}.mdw th{font-weight:600;color:var(--mut);white-space:nowrap}.mdw th.sort{cursor:pointer}.mdw td.n,.mdw th.n{text-align:right}
.mdw .tree ul{list-style:none;margin:0;padding-left:16px;border-left:1px dotted var(--line)}.mdw .tree>ul{border:0;padding-left:0}.mdw .tree li{padding:1px 0}.mdw .tree summary{cursor:pointer}.mdw .tree .sel{background:color-mix(in srgb,var(--acc) 18%,transparent);border-radius:4px}
.mdw .tag{font-size:11px;border:1px solid var(--line);border-radius:4px;padding:0 5px;color:var(--mut);margin-left:6px}.mdw .tag.k{color:var(--acc);border-color:var(--acc)}
.mdw .callout{border-left:4px solid var(--warn);background:color-mix(in srgb,var(--warn) 10%,transparent);padding:6px 10px;margin:6px 0;border-radius:0 6px 6px 0}.mdw .callout.flagConflict{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 10%,transparent)}.mdw .callout.flagNote{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent)}.mdw .callout b{display:block}
.mdw pre{background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:10px;overflow:auto;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;margin:6px 0}.mdw pre .kw{color:var(--acc);font-weight:600}.mdw pre .sym{color:var(--ok)}.mdw pre .cm{color:var(--mut)}
.mdw .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.mdw .card{border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg2)}.mdw .card b{display:block;font-size:22px}
.mdw .bar{height:8px;background:var(--line);border-radius:4px;overflow:hidden;min-width:80px}.mdw .bar i{display:block;height:100%;background:var(--acc)}
.mdw svg.g{width:100%;height:560px;border:1px solid var(--line);border-radius:8px;background:var(--bg)}.mdw svg text{fill:var(--fg);font:12px system-ui,sans-serif}.mdw svg .box{fill:var(--bg2);stroke:var(--line)}.mdw svg .box.c{stroke:var(--acc);stroke-width:2}.mdw svg .box:hover{stroke:var(--acc)}.mdw svg .edge{stroke:var(--mut);fill:none;opacity:.7}.mdw svg .elabel{fill:var(--mut);font-size:10px}
.mdw .gap{color:var(--bad)}.mdw .okc{color:var(--ok)}.mdw .empty{color:var(--mut);padding:30px 0;text-align:center}.mdw .banner{padding:8px 12px;border-bottom:1px solid var(--warn);background:color-mix(in srgb,var(--warn) 10%,transparent);font-size:13px}
@media (max-width:760px){.mdw{grid-template-columns:1fr}.mdw aside{max-height:240px;border-right:0;border-bottom:1px solid var(--line)}.mdw header{grid-column:1}}
`;

const KW = /\b(package|part|port|action|state|item|attribute|requirement|use case|verification|constraint|occurrence|interface|connection|allocation|def|in|out|inout|satisfy|verify|allocate|perform|dependency|from|to|succession|transition|first|then|connect|include|objective|doc|fork|join|ref|abstract)\b/;
function highlight(code: string): HTMLElement {
  const pre = h("pre");
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|([A-Za-z_]\w*::[A-Za-z_]\w*)|([A-Za-z_]\w*)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m.index > last) pre.append(code.slice(last, m.index));
    const cls = m[1] ? "cm" : m[2] ? "sym" : KW.test(m[3]!) ? "kw" : "";
    pre.append(cls ? h("span", { class: cls }, m[0]) : m[0]);
    last = m.index + m[0].length;
  }
  pre.append(code.slice(last));
  return pre;
}
const csvCell = (v: unknown): string => { const t = String(v ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
function download(name: string, text: string): void {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; a.click();
}
const TYPE_COLOR: Record<string, string> = { Object: "#2557d6", Requirement: "#b25e00", Behavior: "#1b7a3a", Condition: "#7b3fb0", "Use Case": "#0e7490", Verification: "#a21caf", "Item Flow": "#64748b", Info: "#8a8f98", Actor: "#0e7490", Artifact: "#8a8f98" };

const TABS: Array<[string, string, boolean]> = [
  ["dashboard", "Dashboard", false], ["table", "Notes", false], ["note", "Note", true], ["structure", "Structure", true], ["where", "Where used", true],
  ["trace", "Traceability", false], ["behavior", "Behavior", true], ["interfaces", "Interfaces", true], ["graph", "Graph", true], ["rels", "Relationships", false], ["review", "Review", false],
];

export function mountWorkbench(root: HTMLElement, host: Host = {}): App {
  const style = h("style"); style.textContent = STYLE;
  let ix: ModelIndex | null = null, sel = "", tab = "dashboard", sidebar: "folders" | "search" = "folders", query = "";
  let tableF: V.TableFilter = { sort: "id" }, relKinds: string[] = [], relText = "", profile = "Structure", gdepth = 0, loading = "";
  const wrap = h("div", { class: "mdw" + (typeof (globalThis as { app?: unknown }).app !== "undefined" ? " obs" : "") });
  root.replaceChildren(style, wrap);

  const note = (p: string): Note | undefined => ix?.notes.get(p);
  const select = (p: string, to?: string): void => { sel = p; if (to) tab = to; else if (!TABS.find((t) => t[0] === tab)?.[2]) tab = "note"; draw(); };
  const lnk = (p: string | null, text?: string): Node => {
    if (!p || !note(p)) return h("span", { class: "mut" }, text ?? p ?? "(unresolved)");
    return h("a", { class: "lnk", href: "#", onclick: (e: Event) => { e.preventDefault(); select(p); } }, text ?? note(p)!.title);
  };
  const typeTag = (n: Note): Node => h("span", { class: "tag" }, n.type + (n.subtype ? "/" + n.subtype : ""));

  /* ---- sidebar ---- */
  function sideTree(t: V.TreeNode, depth: number): HTMLElement {
    const ul = h("ul");
    for (const c of t.children) {
      if (c.kind === "folder") {
        const d = h("details", depth < 1 ? { open: true } : {}, h("summary", {}, c.label + " ", h("span", { class: "mut" }, `(${countNotes(c)})`)), sideTree(c, depth + 1));
        ul.append(h("li", {}, d));
      } else ul.append(h("li", { class: c.path === sel ? "sel" : "" }, lnk(c.path, c.label), h("span", { class: "tag" }, c.detail)));
    }
    return ul;
  }
  const countNotes = (t: V.TreeNode): number => t.children.reduce((a, c) => a + (c.kind === "folder" ? countNotes(c) : 1), 0);
  function drawSidebar(): HTMLElement {
    const box = h("aside");
    const q = h("input", { type: "search", placeholder: "Search id, title, symbol, text", value: query, "aria-label": "Search", oninput: (e: Event) => { query = (e.target as HTMLInputElement).value; sidebar = query ? "search" : "folders"; const pos = (e.target as HTMLInputElement).selectionStart; draw(); const el = wrap.querySelector("aside input") as HTMLInputElement; el.focus(); el.setSelectionRange(pos, pos); } });
    box.append(q);
    if (!ix) { box.append(h("div", { class: "mut" }, loading || "No vault loaded.")); return box; }
    if (sidebar === "search") {
      const hits = V.search(ix, query);
      box.append(hits.length ? h("ul", { style: "list-style:none;padding:0;margin:0" }, ...hits.map((n) => h("li", { style: "padding:2px 0" }, lnk(n.path), typeTag(n), h("div", { class: "mut", style: "font-size:12px" }, n.id)))) : h("div", { class: "mut" }, "No matches."));
    } else box.append(h("div", { class: "tree" }, sideTree(V.folderTree(ix), 0)));
    return box;
  }

  /* ---- shared pieces ---- */
  function treeView(t: V.TreeNode, withQty = true): HTMLElement {
    const li = (n: V.TreeNode): HTMLElement => {
      const label = h("span", {}, lnk(n.path, n.label), n.kind && n.kind !== "root" ? h("span", { class: "tag k" }, n.kind.replace(/^has/, "").toLowerCase()) : null,
        withQty && n.detail ? h("span", { class: "tag" }, n.detail) : null, n.cycle ? h("span", { class: "tag gap" }, "cycle") : null, n.path && note(n.path) ? h("span", { class: "mut", style: "margin-left:6px" }, note(n.path)!.id) : null);
      if (!n.children.length && !n.more) return h("li", {}, label);
      return h("li", {}, h("details", { open: true }, h("summary", {}, label), h("ul", {}, ...n.children.map(li), n.more ? h("li", { class: "mut" }, `… ${n.more} more`) : null)));
    };
    return h("div", { class: "tree" }, h("ul", {}, li(t)));
  }
  function tableOf(heads: Array<[string, string, boolean?]>, rows: Child[][], onSort?: (k: string) => void): HTMLElement {
    return h("table", {}, h("thead", {}, h("tr", {}, ...heads.map(([k, label, num]) => h("th", { class: (onSort ? "sort " : "") + (num ? "n" : ""), onclick: onSort ? () => onSort(k) : undefined }, label)))),
      h("tbody", {}, ...rows.map((r) => h("tr", {}, ...r.map((c, i) => h("td", { class: heads[i]?.[2] ? "n" : "" }, c))))));
  }
  const empty = (msg: string): HTMLElement => h("div", { class: "empty" }, msg);
  const needNote = (): HTMLElement | null => (sel && note(sel) ? null : empty("Pick a note on the left."));

  /* ---- views ---- */
  function vDashboard(): HTMLElement {
    const d = V.dashboard(ix!), pane = h("div", { class: "pane" }, h("h2", {}, "Vault overview"));
    const card = (label: string, v: string | number, cls = ""): HTMLElement => h("div", { class: "card" }, h("b", { class: cls }, String(v)), h("span", { class: "mut" }, label));
    pane.append(h("div", { class: "cards" }, card("notes", d.notes), card("with SysML v2 block", d.blocks), card("relationships", ix!.edges.length), card("flags", d.flags.reduce((a, x) => a + x[1], 0), d.flags.length ? "gap" : ""),
      card("unresolved references", d.dangling, d.dangling ? "gap" : ""), card("not-recognized statements", d.warnings, d.warnings ? "gap" : ""), card("isolated notes", d.orphans), card("parser check", d.parser === "passed" ? "passed" : d.parser === "failed" ? "FAILED" : "not run", d.parser === "passed" ? "okc" : "gap")));
    const bars = (title: string, rows: Array<[string, number]>, click?: (k: string) => void): HTMLElement => {
      const max = Math.max(1, ...rows.map((r) => r[1]));
      return h("div", {}, h("h3", {}, title), tableOf([["k", ""], ["bar", ""], ["n", "", true]], rows.map(([k, n]) => [click ? h("a", { class: "lnk", href: "#", onclick: (e: Event) => { e.preventDefault(); click(k); } }, k) : k, h("div", { class: "bar" }, h("i", { style: `width:${(100 * n) / max}%` })), String(n)])));
    };
    pane.append(h("div", { class: "cards", style: "grid-template-columns:repeat(auto-fit,minmax(260px,1fr))" },
      bars("By type", d.byType, (k) => { tableF = { sort: "id", type: k }; tab = "table"; draw(); }), bars("By status", d.byStatus, (k) => { tableF = { sort: "id", status: k === "(none)" ? "" : k }; tab = "table"; draw(); }),
      bars("Flags", d.flags, () => { tab = "review"; draw(); }), bars("Relationships by kind", d.edgeKinds, (k) => { relKinds = [k]; tab = "rels"; draw(); })));
    pane.append(h("h3", {}, "Requirement coverage"), h("div", {}, `${d.requirements.satisfied} of ${d.requirements.total} satisfied · ${d.requirements.verified} of ${d.requirements.total} verified`));
    return pane;
  }

  function vTable(): HTMLElement {
    const pane = h("div", { class: "pane" }, h("h2", {}, "Notes"));
    const types = [...new Set([...ix!.notes.values()].map((n) => n.type))].sort(), statuses = [...new Set([...ix!.notes.values()].map((n) => n.status))].sort();
    const redraw = (): void => { draw(); };
    pane.append(h("div", { class: "row" },
      h("input", { type: "search", placeholder: "Filter", value: tableF.text ?? "", onchange: (e: Event) => { tableF.text = (e.target as HTMLInputElement).value; redraw(); } }),
      h("select", { onchange: (e: Event) => { tableF.type = (e.target as HTMLSelectElement).value; redraw(); } }, h("option", { value: "" }, "all types"), ...types.map((t) => h("option", { value: t, selected: tableF.type === t }, t))),
      h("select", { onchange: (e: Event) => { tableF.status = (e.target as HTMLSelectElement).value; redraw(); } }, h("option", { value: "" }, "all statuses"), ...statuses.map((t) => h("option", { value: t, selected: tableF.status === t }, t || "(none)"))),
      h("label", {}, h("input", { type: "checkbox", checked: !!tableF.flagged, onchange: (e: Event) => { tableF.flagged = (e.target as HTMLInputElement).checked; redraw(); } }), " flagged"),
      h("label", {}, h("input", { type: "checkbox", checked: !!tableF.unresolved, onchange: (e: Event) => { tableF.unresolved = (e.target as HTMLInputElement).checked; redraw(); } }), " unresolved"),
      h("button", { onclick: () => download("notes.csv", [["id", "type", "subtype", "title", "status", "folder", "flags", "path"].join(","), ...rows.map((r) => [r.id, r.type, r.subtype, r.title, r.status, r.folder, r.flags, r.path].map(csvCell).join(","))].join("\n")) }, "Export CSV")));
    const rows = V.tableRows(ix!, tableF), cap = rows.slice(0, 1000);
    pane.append(h("div", { class: "mut" }, `${rows.length} notes${rows.length > cap.length ? " (first 1,000 shown)" : ""}`));
    pane.append(tableOf([["id", "ID"], ["type", "Type"], ["title", "Title"], ["status", "Status"], ["folder", "Folder"], ["flags", "Flags", true], ["out", "Out", true], ["inn", "In", true], ["block", "SysML"]],
      cap.map((r) => [r.id, r.type + (r.subtype ? "/" + r.subtype : ""), lnk(r.path, r.title), r.status, r.folder, r.flags ? String(r.flags) : "", String(r.out), String(r.inn), r.block ? "yes" : ""]),
      (k) => { tableF.desc = tableF.sort === k ? !tableF.desc : false; tableF.sort = k; redraw(); }));
    return pane;
  }

  function relList(edges: Array<{ e: import("./index.ts").Edge; other: string | null; sym: string }>): HTMLElement {
    const by = new Map<string, typeof edges>();
    for (const x of edges) (by.get(x.e.kind) ?? by.set(x.e.kind, []).get(x.e.kind)!).push(x);
    if (!by.size) return h("div", { class: "mut" }, "None.");
    return h("div", {}, ...[...by].map(([k, list]) => h("div", {}, h("span", { class: "tag k" }, k), " ", ...list.flatMap((x, i) => [i ? ", " : "", x.other ? lnk(x.other) : h("span", { class: "gap" }, x.sym + " (unresolved)"), x.e.label ? h("span", { class: "mut" }, ` ${x.e.label}`) : null]))));
  }

  function vNote(): HTMLElement {
    const miss = needNote(); if (miss) return miss;
    const n = note(sel)!, pane = h("div", { class: "pane" });
    pane.append(h("h2", {}, n.title), h("div", { class: "row" }, h("span", { class: "pill" }, n.id), typeTag(n), h("span", { class: "pill" }, n.status || "no status"),
      n.block ? h("span", { class: "pill " + (ix!.parser === "passed" ? "ok" : ix!.parser === "failed" ? "bad" : "warn") }, ix!.parser === "passed" ? "SysML checked" : ix!.parser === "failed" ? "SysML check failed" : "SysML unchecked") : null,
      host.openNote ? h("button", { onclick: () => host.openNote!(n.path) }, "Open in editor") : null));
    for (const f of n.flags) pane.append(h("div", { class: "callout " + f.type }, h("b", {}, f.type.replace("flag", "") + ": " + f.title), f.detail));
    if (n.body) pane.append(h("div", { style: "white-space:pre-wrap;margin:10px 0" }, n.body));
    pane.append(h("h3", {}, "Properties"), tableOf([["k", "Field"], ["v", "Value"]], Object.entries(n.meta).map(([k, v]) => [k, v])), h("div", { class: "mut" }, n.path));
    const o = V.relationshipRows(ix!).length ? null : null; void o;
    const out = (ix!.out.get(n.path) ?? []).map((e) => ({ e, other: e.to, sym: e.toSymbol })), inn = (ix!.inn.get(n.path) ?? []).map((e) => ({ e, other: e.from, sym: e.from }));
    pane.append(h("h3", {}, "Relates to"), relList(out), h("h3", {}, "Related from"), relList(inn));
    if (n.def?.usages.length) pane.append(h("h3", {}, "Usages"), tableOf([["k", "Kind"], ["name", "Name"], ["type", "Type"], ["mult", "Multiplicity"]], n.def.usages.map((u) => [(u.dir ? u.dir + " " : "") + u.kind, u.name, u.type ? lnk(ix!.bySymbol.get(u.type) ?? null, u.type) : h("span", { class: "gap" }, "untyped"), u.mult ?? ""])));
    if (n.block) pane.append(h("h3", {}, "SysML v2"), highlight(n.block), n.warnings.length ? h("div", { class: "gap" }, n.warnings.join("; ")) : null);
    if (n.sourceLines.length) pane.append(h("h3", {}, "Provenance (Source: EA)"), h("ul", {}, ...n.sourceLines.map((l) => h("li", {}, l.slice(2)))));
    return pane;
  }

  function vStructure(): HTMLElement {
    const miss = needNote(); if (miss) return miss;
    const r = V.structure(ix!, sel), pane = h("div", { class: "pane" }, h("h2", {}, "Structure of " + note(sel)!.title));
    if (r.supers.length) pane.append(h("div", {}, "Specializes: ", ...r.supers.flatMap((p, i) => [i ? " → " : "", lnk(p)])));
    if (r.subs.length) pane.append(h("div", {}, "Specialized by: ", ...r.subs.flatMap((p, i) => [i ? ", " : "", lnk(p)])));
    pane.append(r.tree.children.length ? treeView(r.tree) : empty("This definition owns no typed usages."));
    if (r.untyped.length) pane.append(h("div", { class: "gap" }, "Untyped: " + r.untyped.join(", ")));
    const b = V.bom(ix!, sel);
    if (b.length) pane.append(h("h3", {}, "Parts list (rolled up)"), tableOf([["t", "Part"], ["q", "Quantity", true], ["d", "Depth", true]], b.map((x) => [lnk(x.path, x.title), String(x.qty), String(x.depth)])),
      h("button", { onclick: () => download("parts-list.csv", ["part,quantity,depth", ...b.map((x) => [x.title, x.qty, x.depth].map(csvCell).join(","))].join("\n")) }, "Export CSV"));
    return pane;
  }

  function vWhere(): HTMLElement {
    const miss = needNote(); if (miss) return miss;
    const r = V.whereUsed(ix!, sel), pane = h("div", { class: "pane" }, h("h2", {}, "Where " + note(sel)!.title + " is used"));
    pane.append(r.tree.children.length ? treeView(r.tree) : empty("Nothing owns, specializes or performs this note."));
    if (r.roots.length) pane.append(h("h3", {}, "Top-level assemblies"), h("div", {}, ...r.roots.flatMap((p, i) => [i ? ", " : "", lnk(p)])));
    if (r.references.length) pane.append(h("h3", {}, "Other references"), tableOf([["k", "Kind"], ["f", "From"], ["l", "Label"]], r.references.map((x) => [x.kind, lnk(x.path), x.label])));
    return pane;
  }

  function vTrace(): HTMLElement {
    const t = V.traceMatrix(ix!), pane = h("div", { class: "pane" }, h("h2", {}, "Requirement traceability"));
    if (!t.total) return h("div", { class: "pane" }, empty("No requirements in this vault."));
    const pct = (a: number): string => `${Math.round((100 * a) / t.total)}%`;
    pane.append(h("div", { class: "row" }, h("span", { class: "pill" }, `${t.total} requirements`), h("span", { class: "pill " + (t.satisfied === t.total ? "ok" : "warn") }, `satisfied ${pct(t.satisfied)}`), h("span", { class: "pill " + (t.verified === t.total ? "ok" : "warn") }, `verified ${pct(t.verified)}`),
      h("button", { onclick: () => download("traceability.csv", ["id,title,status,satisfied by,verified by,derived from,derives,gaps", ...t.rows.map((r) => [r.id, r.title, r.status, r.satisfiedBy.map((p) => note(p)?.title).join("; "), r.verifiedBy.map((p) => note(p)?.title).join("; "), r.derivedFrom.map((p) => note(p)?.title).join("; "), r.derives.map((p) => note(p)?.title).join("; "), r.gaps.join("; ")].map(csvCell).join(","))].join("\n")) }, "Export CSV")));
    const cell = (l: string[]): Node => h("span", {}, ...l.flatMap((p, i) => [i ? ", " : "", lnk(p)]));
    pane.append(tableOf([["i", "ID"], ["t", "Requirement"], ["sat", "Satisfied by"], ["ver", "Verified by"], ["d", "Derived from"], ["dd", "Derives"], ["g", "Gaps"]],
      t.rows.map((r) => [r.id, lnk(r.path, r.title), cell(r.satisfiedBy), cell(r.verifiedBy), cell(r.derivedFrom), cell(r.derives), h("span", { class: "gap" }, r.gaps.join(", "))])));
    return pane;
  }

  function flowSvg(f: V.FlowResult): SVGElement {
    const layers = new Map<number, V.FlowNode[]>();
    for (const n of f.nodes) (layers.get(n.layer) ?? layers.set(n.layer, []).get(n.layer)!).push(n);
    const W = 170, H = 38, GX = 70, GY = 22, pos = new Map<string, { x: number; y: number }>();
    let maxY = 0;
    for (const [l, list] of layers) list.forEach((n, i) => { const p = { x: 20 + l * (W + GX), y: 20 + i * (H + GY) }; pos.set(n.name, p); maxY = Math.max(maxY, p.y + H); });
    const width = 40 + (layers.size) * (W + GX), svg = s("svg", { class: "g", viewBox: `0 0 ${Math.max(width, 400)} ${maxY + 30}`, role: "img", "aria-label": "Flow" });
    svg.append(s("defs", {}, s("marker", { id: "ar", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" }, s("path", { d: "M0 0L10 5L0 10z", fill: "currentColor" }))));
    for (const e of f.edges) { const a = pos.get(e.from)!, b = pos.get(e.to)!; svg.append(s("path", { class: "edge", d: `M${a.x + W} ${a.y + H / 2} C${a.x + W + 40} ${a.y + H / 2} ${b.x - 40} ${b.y + H / 2} ${b.x} ${b.y + H / 2}`, "marker-end": "url(#ar)", style: "color:var(--mut)" })); }
    for (const n of f.nodes) {
      const p = pos.get(n.name)!, ctrl = n.kind === "fork" || n.kind === "join";
      const g = s("g", { style: n.path ? "cursor:pointer" : "" }, s("rect", { class: "box", x: p.x, y: p.y, width: W, height: H, rx: ctrl ? 4 : 10 }), s("text", { x: p.x + 10, y: p.y + 16 }, n.name), s("text", { class: "elabel", x: p.x + 10, y: p.y + 30 }, ctrl ? n.kind : n.type || n.kind));
      if (n.path) g.addEventListener("click", () => select(n.path!));
      svg.append(g);
    }
    return svg;
  }
  function vBehavior(): HTMLElement {
    const miss = needNote(); if (miss) return miss;
    const f = V.behavior(ix!, sel), pane = h("div", { class: "pane" }, h("h2", {}, (f.kind === "states" ? "States of " : "Actions of ") + note(sel)!.title));
    if (f.kind === "none") return h("div", { class: "pane" }, h("h2", {}, note(sel)!.title), empty("This note has no actions or states."));
    pane.append(flowSvg(f));
    if (f.triggers.length) pane.append(h("h3", {}, "Triggers"), h("ul", {}, ...f.triggers.map((t) => h("li", {}, t))));
    if (f.unresolved.length) pane.append(h("h3", {}, "Not drawn"), h("ul", {}, ...f.unresolved.map((t) => h("li", { class: "gap" }, t))));
    const srcFlows = note(sel)!.sourceLines.filter((l) => /^- (Succession|Transition)/.test(l));
    if (srcFlows.length) pane.append(h("h3", {}, "Guards and triggers (from EA)"), h("ul", {}, ...srcFlows.map((l) => h("li", {}, l.slice(2).replace(/ — EA GUID.*$/, "")))));
    return pane;
  }

  function vInterfaces(): HTMLElement {
    const miss = needNote(); if (miss) return miss;
    const r = V.interfaces(ix!, sel), pane = h("div", { class: "pane" }, h("h2", {}, "Interfaces of " + note(sel)!.title));
    if (!r.ports.length && !r.flows.length && !r.connections.length && !r.users.length) return h("div", { class: "pane" }, h("h2", {}, note(sel)!.title), empty("No ports, flows or connections."));
    if (r.ports.length) pane.append(h("h3", {}, "Ports"), tableOf([["n", "Port"], ["t", "Type"]], r.ports.map((p) => [p.name, p.path ? lnk(p.path) : h("span", { class: "gap" }, p.type || "untyped")])));
    if (r.flows.length) pane.append(h("h3", {}, "Flows"), tableOf([["d", "Direction"], ["n", "Name"], ["t", "Carries"]], r.flows.map((p) => [p.dir, p.name, p.path ? lnk(p.path) : h("span", { class: "gap" }, p.type || "untyped")])));
    if (r.connections.length) pane.append(h("h3", {}, "Connections"), tableOf([["a", "From"], ["b", "To"]], r.connections.map((c) => [c.from, c.to])));
    if (r.users.length) pane.append(h("h3", {}, "Used by (as a port type)"), h("div", {}, ...r.users.flatMap((p, i) => [i ? ", " : "", lnk(p)])));
    return pane;
  }

  function vGraph(): HTMLElement {
    const miss = needNote(); if (miss) return miss;
    const prof = V.PROFILES.find((p) => p.name === profile)!, depth = gdepth || prof.depth;
    const g = V.traverse(ix!, sel, prof, depth), placed = V.layoutRadial(g), pos = new Map(placed.map((p) => [p.path, p]));
    const xs = placed.map((p) => p.x), ys = placed.map((p) => p.y), pad = 110;
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - 40, w = Math.max(...xs) - Math.min(...xs) + pad * 2, hh = Math.max(...ys) - Math.min(...ys) + 100;
    const svg = s("svg", { class: "g", viewBox: `${minX} ${minY} ${Math.max(w, 400)} ${Math.max(hh, 260)}`, role: "img", "aria-label": "Relationship graph" });
    svg.append(s("defs", {}, s("marker", { id: "ag", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, s("path", { d: "M0 0L10 5L0 10z", fill: "currentColor" }))));
    for (const e of g.edges) {
      const a = pos.get(e.from), b = pos.get(e.to!); if (!a || !b) continue;
      svg.append(s("line", { class: "edge", x1: a.x, y1: a.y, x2: b.x, y2: b.y, "marker-end": "url(#ag)", style: "color:var(--mut)" }), s("text", { class: "elabel", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 3, "text-anchor": "middle" }, e.kind));
    }
    for (const p of placed) {
      const n = note(p.path); if (!n) continue;
      const title = n.title.length > 22 ? n.title.slice(0, 21) + "…" : n.title;
      const grp = s("g", { style: "cursor:pointer" }, s("rect", { class: "box" + (p.depth === 0 ? " c" : ""), x: p.x - 70, y: p.y - 18, width: 140, height: 36, rx: 8, style: `border-left:3px solid ${TYPE_COLOR[n.type] ?? "#888"}` }),
        s("rect", { x: p.x - 70, y: p.y - 18, width: 5, height: 36, fill: TYPE_COLOR[n.type] ?? "#888", rx: 2 }), s("text", { x: p.x - 60, y: p.y - 3 }, title), s("text", { class: "elabel", x: p.x - 60, y: p.y + 11 }, n.id));
      grp.addEventListener("click", () => select(p.path, "graph"));
      svg.append(grp);
    }
    return h("div", { class: "pane" }, h("h2", {}, "Graph around " + note(sel)!.title), h("div", { class: "row" },
      h("select", { "aria-label": "View profile", onchange: (e: Event) => { profile = (e.target as HTMLSelectElement).value; gdepth = 0; draw(); } }, ...V.PROFILES.map((p) => h("option", { value: p.name, selected: p.name === profile }, p.name))),
      h("label", {}, "depth ", h("input", { type: "number", min: 1, max: 6, value: depth, style: "width:60px", onchange: (e: Event) => { gdepth = +(e.target as HTMLInputElement).value || 0; draw(); } })),
      h("span", { class: "mut" }, `${g.nodes.length} notes, ${g.edges.length} links${g.capped ? " (capped)" : ""} — ${prof.description}`)), g.nodes.length > 1 ? svg : empty("No relationships of this kind from this note."));
  }

  function vRels(): HTMLElement {
    const pane = h("div", { class: "pane" }, h("h2", {}, "Relationships")), kinds = V.edgeKinds(ix!);
    pane.append(h("div", { class: "row" }, h("input", { type: "search", placeholder: "Filter", value: relText, onchange: (e: Event) => { relText = (e.target as HTMLInputElement).value; draw(); } }),
      ...kinds.map(([k, n]) => h("label", { class: "pill" }, h("input", { type: "checkbox", checked: relKinds.includes(k), onchange: (e: Event) => { relKinds = (e.target as HTMLInputElement).checked ? [...relKinds, k] : relKinds.filter((x) => x !== k); draw(); } }), ` ${k} ${n}`))));
    const rows = V.relationshipRows(ix!, relKinds, relText), cap = rows.slice(0, 1500);
    pane.append(h("div", { class: "mut" }, `${rows.length} relationships${rows.length > cap.length ? " (first 1,500 shown)" : ""}`),
      tableOf([["f", "From"], ["k", "Kind"], ["t", "To"], ["l", "Label"], ["v", "Via"]], cap.map((r) => [lnk(r.from, r.fromTitle), h("span", { class: "tag k" }, r.kind), r.resolved ? lnk(r.to, r.toTitle) : h("span", { class: "gap" }, r.toTitle + " (unresolved)"), r.label, r.via])),
      h("button", { onclick: () => download("relationships.csv", ["from,kind,to,label,via", ...rows.map((r) => [r.fromTitle, r.kind, r.toTitle, r.label, r.via].map(csvCell).join(","))].join("\n")) }, "Export CSV"));
    return pane;
  }

  function vReview(): HTMLElement {
    const items = V.reviewQueue(ix!), pane = h("div", { class: "pane" }, h("h2", {}, "Review queue"));
    if (ix!.parser !== "passed") pane.append(h("div", { class: "callout" }, h("b", {}, "SysML blocks are not parser-checked"), ix!.parser === "failed" ? "The last parser check failed." : "No parser report was found. Blocks are shown as written; the pinned parser gate decides conformance."));
    if (!items.length) return (pane.append(empty("Nothing to review.")), pane);
    const cats = new Map<string, number>(); for (const i of items) cats.set(i.category, (cats.get(i.category) ?? 0) + 1);
    pane.append(h("div", { class: "row" }, ...[...cats].map(([k, n]) => h("span", { class: "pill" }, `${k} ${n}`))));
    const cap = items.slice(0, 1000);
    pane.append(tableOf([["s", "Severity"], ["c", "Category"], ["n", "Note"], ["m", "Detail"]], cap.map((i) => [h("span", { class: i.severity === "high" ? "gap" : "" }, i.severity), i.category, i.path ? lnk(i.path) : "", i.message])));
    if (items.length > cap.length) pane.append(h("div", { class: "mut" }, `${items.length - cap.length} more not shown`));
    return pane;
  }

  /* ---- shell ---- */
  const views: Record<string, () => HTMLElement> = { dashboard: vDashboard, table: vTable, note: vNote, structure: vStructure, where: vWhere, trace: vTrace, behavior: vBehavior, interfaces: vInterfaces, graph: vGraph, rels: vRels, review: vReview };
  function draw(): void {
    const header = h("header", {}, h("b", {}, "MDSE Workbench"), ix ? h("span", { class: "pill" }, `${ix.notes.size} notes · ${ix.edges.length} links · built in ${ix.builtMs} ms`) : null,
      ix ? h("span", { class: "pill " + (ix.parser === "passed" ? "ok" : ix.parser === "failed" ? "bad" : "warn") }, ix.parser === "passed" ? "SysML checked" : ix.parser === "failed" ? "SysML check failed" : "SysML not parser-checked") : null,
      loading ? h("span", { class: "pill warn" }, loading) : null, h("span", { id: "mdw-host-actions" }));
    const nav = h("nav", { class: "tabs", role: "tablist" }, ...TABS.map(([k, label, per]) => h("button", { role: "tab", "aria-selected": tab === k, disabled: !ix || (per && !sel) || undefined, onclick: () => { tab = k; draw(); } }, label)));
    let body: HTMLElement;
    try { body = ix ? views[tab]!() : h("div", { class: "pane" }, empty(loading || "Open a vault folder or an MDSE.zip to begin.")); }
    catch (e) { body = h("div", { class: "pane" }, h("div", { class: "callout flagConflict" }, h("b", {}, "This view failed to draw"), String((e as Error)?.message ?? e)), h("pre", {}, String((e as Error)?.stack ?? ""))); console.error(e); }
    const actions = wrap.querySelector("#mdw-host-actions"); const keep = actions ? [...actions.childNodes] : [];
    const main = h("main", {}, nav, body);
    wrap.replaceChildren(header, drawSidebar(), main);
    const slot = wrap.querySelector("#mdw-host-actions"); if (slot) slot.append(...keep);
  }
  draw();

  return {
    async setFiles(files) {
      loading = "Reading notes…"; ix = null; draw();
      const yieldFn = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
      const parserReport = files.get("99_System/11_Import/Parser Check.md");
      ix = await buildIndexAsync(files, { ...(host.classes ? { classes: host.classes } : {}), ...(parserReport ? { parserReport } : {}), yieldEvery: 300, yieldFn }, (d, t) => { loading = `Reading notes… ${d}/${t}`; });
      loading = ""; sel = ""; tab = "dashboard"; draw();
    },
    select(p) { if (ix?.notes.has(p)) select(p, "note"); },
    index: () => ix,
    destroy() { wrap.remove(); style.remove(); },
  };
}
