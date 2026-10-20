/* The Edit lens (D-0030): add a relationship from the selected note, add an element, set a requirement's text.
 * Choices are drop-downs; targets are picked from a searchable, folder-grouped browser. Every edit is previewed as a
 * diff and applied only on a click; the host writes the files and returns a way back (WKB-006). Plain DOM, vault strings as text. */
import { h } from "./ui.ts";
import type { Child } from "./ui.ts";
import type { ModelIndex, Note } from "./index.ts";
import * as ED from "./edit.ts";

export interface EditHost {
  files(): Map<string, string>;
  classes(): ED.EdClasses;
  author(): string;
  folders(): string[];
  applyPlan(plan: ED.EditPlan): Promise<{ message: string; undo: () => Promise<string> }>;
}
export interface EditCtx { ix: ModelIndex; sel: string; host: EditHost; done(message: string, undo: (() => Promise<string>) | null): void; open(path: string): void }

export const EDIT_STYLE = `
.mded .tabs{display:flex;gap:4px;margin:0 0 8px}.mded .tabs button{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:999px;background:var(--bg2);color:var(--fg);cursor:pointer}.mded .tabs button[aria-pressed=true]{border-color:var(--acc);font-weight:600}
.mded label.f{display:block;margin:6px 0 2px;font-size:12px;color:var(--mut)}.mded select,.mded input[type=text],.mded input[type=search],.mded textarea{width:100%;box-sizing:border-box}.mded textarea{min-height:80px}
.mded .pick{max-height:240px;overflow:auto;border:1px solid var(--line);border-radius:6px;margin-top:4px}.mded .pick summary{cursor:pointer;padding:2px 6px;background:var(--bg2);font-size:12px}
.mded .pick .it{padding:3px 8px;cursor:pointer;border-top:1px solid var(--line);font-size:12.5px}.mded .pick .it:hover{background:var(--bg2)}.mded .pick .it[aria-selected=true]{outline:2px solid var(--acc);outline-offset:-2px}
.mded .pick .it .sn{color:var(--mut);font-size:11.5px;white-space:normal}
.mded .diff{font-family:var(--font-monospace,monospace);font-size:11.5px;white-space:pre-wrap;border:1px solid var(--line);border-radius:6px;padding:4px 6px;margin:6px 0}.mded .diff .add{color:#1b7a3a}.mded .diff .del{color:#b3261e;text-decoration:line-through}
.mded .acts2{display:flex;gap:6px;margin:8px 0}
`;

type Mode = "rel" | "elem" | "text";
const SAVED: { mode: Mode } = { mode: "rel" };                       // survives redraws of the panel

export function editView(c: EditCtx): HTMLElement {
  const { ix, host } = c, from = ix.notes.get(c.sel), box = h("div", { class: "mded" });
  const tabs = h("div", { class: "tabs" });
  const body = h("div", {});
  const setMode = (m: Mode): void => { SAVED.mode = m; render(); };
  for (const [m, label] of [["rel", "Add relationship"], ["elem", "Add element"], ["text", "Requirement text"]] as Array<[Mode, string]>) tabs.append(h("button", { "aria-pressed": SAVED.mode === m, onclick: () => setMode(m) }, label));
  box.append(tabs, body);

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
      const b = e.target as HTMLButtonElement; b.disabled = true;
      try { const r = await host.applyPlan(p); c.done(r.message, r.undo); if (p.writes[0]?.before === null) c.open(p.writes[0].path); }
      catch (err) { b.disabled = false; showPlan({ summary: "", writes: [], problems: [String((err as Error)?.message ?? err)] }); }
    } }, "Apply"), h("button", { class: "sm", onclick: () => showPlan(null) }, "Cancel"));
  };
  const field = (label: string, el: HTMLElement): HTMLElement => h("div", {}, h("label", { class: "f" }, label), el);
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
      if (rel.inputs.includes("name")) extra.append(field("Name of the usage", name));
      if (rel.inputs.includes("mult")) extra.append(field("Quantity (multiplicity)", mult));
      if (rel.inputs.includes("dir") && target && ED.edUsageKinds(target)[0] === "item") extra.append(field("Flow direction", h("select", { "aria-label": "Direction", onchange: (e: Event) => { dir = (e.target as HTMLSelectElement).value; } }, ...opts([["", "(none)"], ["in", "in"], ["out", "out"], ["inout", "inout"]], dir))));
      if (rel.id === "owns" && target && ED.edUsageKinds(target).length > 1) extra.append(field("Usage kind", h("select", { onchange: (e: Event) => { usageKind = (e.target as HTMLSelectElement).value; } }, ...opts(ED.edUsageKinds(target).map((k) => [k, k]), usageKind))));
    };
    const drawPicker = (): void => {
      target = null; showPlan(null); drawExtra();
      const items = ED.edTargets(ix, rel, from);
      pickBox.replaceChildren(items.length ? picker(items, (n) => { target = n; usageKind = ED.edUsageKinds(n)[0] ?? ""; drawExtra(); showPlan(null); }, "").el : h("div", { class: "empty", style: "padding:8px" }, "No eligible target in the vault."));
    };
    kindSel.append(...opts(rels.map((r) => [r.id, r.label]), rel.id));
    kindSel.addEventListener("change", () => { rel = rels.find((r) => r.id === kindSel.value)!; help.textContent = rel.help; drawPicker(); });
    help.textContent = rel.help;
    v.append(h("div", {}, h("b", {}, from.title), " ", h("span", { class: "mut" }, `${from.id} · ${ED.edRelsFor(from).length} relationship kinds`)), field("Relationship", kindSel), help, field("Target", pickBox), extra, h("div", { class: "acts2" }, h("button", { class: "sm", onclick: compute }, "Preview")), previewBox, applyRow);
    drawPicker();
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

  function render(): void {
    for (const [i, b] of Array.from(tabs.children).entries()) b.setAttribute("aria-pressed", String((["rel", "elem", "text"] as Mode[])[i] === SAVED.mode));
    plan = null; previewBox.replaceChildren(); applyRow.replaceChildren();
    body.replaceChildren(SAVED.mode === "rel" ? relView() : SAVED.mode === "elem" ? elemView() : textView());
  }
  void plan;
  render();
  return box;
}
